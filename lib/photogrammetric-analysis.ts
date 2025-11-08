/**
 * Photogrammetric Analysis - Using known object dimensions to calculate room measurements
 * This is our competitive advantage - accurate spatial measurements from reference objects
 */

import { getAnalysisModel } from './gemini';
import { dataUrlToBase64, getMimeType } from './utils';
import { STANDARD_DIMENSIONS, validateAgainstCodes, type DimensionStandard } from './standard-dimensions';

export interface ReferenceObject {
  objectType: string; // Key from STANDARD_DIMENSIONS
  detectedName: string; // What AI calls it
  apparentPixelWidth: number;
  apparentPixelHeight: number;
  confidence: number; // 0-1
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SpatialMeasurements {
  ceilingHeight: {
    inches: number;
    feet: string;
    confidence: number;
    method: string;
    codeCompliance: { valid: boolean; message: string };
  };
  roomDimensions: {
    widthInches: number;
    lengthInches: number;
    widthFeet: string;
    lengthFeet: string;
    squareFootage: number;
    confidence: number;
  };
  referenceObjectsUsed: ReferenceObject[];
  calibrationQuality: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[];
}

/**
 * Step 1: Detect reference objects with known dimensions
 */
export async function detectReferenceObjects(
  imageDataUrl: string
): Promise<ReferenceObject[]> {
  const model = getAnalysisModel();
  const imageBase64 = await dataUrlToBase64(imageDataUrl);
  const mimeType = getMimeType(imageDataUrl);

  // Build list of objects to look for
  const objectsList = Object.keys(STANDARD_DIMENSIONS).map(key => {
    const std = STANDARD_DIMENSIONS[key];
    return `${std.name} (${std.typical.width.standard}W x ${std.typical.height.standard}H inches)`;
  }).join(', ');

  const prompt = `Analyze this image and identify ALL objects with KNOWN standard dimensions.

REFERENCE OBJECTS TO LOOK FOR:
${objectsList}

For each object you can see clearly, provide:
1. The object name (match to the list above)
2. Confidence you can see it clearly (0-100%)
3. Whether it's a full view or partial view
4. Its approximate position in the image (left/center/right, top/middle/bottom)

RESPOND IN JSON FORMAT:
{
  "detectedObjects": [
    {
      "objectName": "Standard Refrigerator",
      "standardKey": "refrigerator_standard",
      "confidence": 85,
      "visibility": "full|partial",
      "position": "left-bottom",
      "notes": "clear view, standard size"
    }
  ],
  "imageQuality": "excellent|good|fair|poor"
}

CRITICAL: Only include objects you can see CLEARLY and COMPLETELY. Partial views reduce accuracy.`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: imageBase64 } }
    ]);

    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Convert to ReferenceObject format
    const referenceObjects: ReferenceObject[] = parsed.detectedObjects.map((obj: any) => ({
      objectType: obj.standardKey,
      detectedName: obj.objectName,
      apparentPixelWidth: 0, // Will be calculated in step 2
      apparentPixelHeight: 0,
      confidence: obj.confidence / 100,
    }));

    return referenceObjects;
  } catch (error) {
    console.error('Error detecting reference objects:', error);
    return [];
  }
}

/**
 * Step 2: Calculate spatial measurements using reference objects
 */
export async function calculateSpatialMeasurements(
  imageDataUrl: string,
  referenceObjects: ReferenceObject[]
): Promise<SpatialMeasurements> {
  if (referenceObjects.length === 0) {
    return {
      ceilingHeight: {
        inches: 96,
        feet: "8'0\"",
        confidence: 0.3,
        method: 'default_assumption',
        codeCompliance: { valid: true, message: 'Using standard default' }
      },
      roomDimensions: {
        widthInches: 144,
        lengthInches: 168,
        widthFeet: "12'0\"",
        lengthFeet: "14'0\"",
        squareFootage: 168,
        confidence: 0.2
      },
      referenceObjectsUsed: [],
      calibrationQuality: 'poor',
      warnings: ['No reference objects detected - using defaults']
    };
  }

  const model = getAnalysisModel();
  const imageBase64 = await dataUrlToBase64(imageDataUrl);
  const mimeType = getMimeType(imageDataUrl);

  // Build detailed measurement prompt
  const referenceDetails = referenceObjects.map(ref => {
    const std = STANDARD_DIMENSIONS[ref.objectType];
    if (!std) {
      console.warn(`Unknown reference object type: ${ref.objectType}`);
      return `${ref.detectedName}: (unknown dimensions)`;
    }
    return `${std.name}: ${std.typical.width.standard}W x ${std.typical.height.standard}H inches`;
  }).filter(item => !item.includes('unknown')).join('\n');

  if (referenceDetails.length === 0) {
    console.warn('No valid reference objects with known dimensions');
  }

  const prompt = `You are a spatial measurement expert. Using the reference objects with KNOWN dimensions, calculate the room's actual measurements.

REFERENCE OBJECTS DETECTED (with their KNOWN real-world dimensions):
${referenceDetails}

TASK:
1. Identify the CEILING HEIGHT by comparing vertical reference (like refrigerator height 68", door height 80", or counter height 36")
2. Estimate ROOM WIDTH by comparing horizontal references (like appliance widths, cabinet runs)
3. Estimate ROOM LENGTH/DEPTH using perspective and reference objects

CALCULATION METHOD:
- If you see a refrigerator (68" tall), and it appears to be roughly 70% of the ceiling height in the image, then ceiling = 68 / 0.7 = 97 inches
- If a 30" wide stove appears to be 15% of the wall width, then wall = 30 / 0.15 = 200 inches
- Use multiple references to triangulate and validate

RESPOND IN JSON FORMAT:
{
  "ceilingHeight": {
    "inches": 96,
    "calculationMethod": "refrigerator_reference",
    "confidence": 0.85,
    "reasoning": "Refrigerator (68\" standard) appears to be 71% of ceiling height"
  },
  "roomWidth": {
    "inches": 144,
    "calculationMethod": "appliance_references",
    "confidence": 0.80,
    "reasoning": "Stove (30\") + cabinets span approximately 60% of visible wall"
  },
  "roomLength": {
    "inches": 168,
    "calculationMethod": "perspective_estimation",
    "confidence": 0.65,
    "reasoning": "Based on depth perception and visible floor area"
  },
  "measurements": [
    {
      "object": "refrigerator",
      "apparentHeightRatio": 0.71,
      "usedForCalculation": true
    }
  ]
}`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: imageBase64 } }
    ]);

    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const ceilingInches = parsed.ceilingHeight.inches;
    const widthInches = parsed.roomWidth.inches;
    const lengthInches = parsed.roomLength.inches;

    const ceilingFeet = Math.floor(ceilingInches / 12);
    const ceilingInchesRem = Math.round(ceilingInches % 12);
    const widthFeet = Math.floor(widthInches / 12);
    const widthInchesRem = Math.round(widthInches % 12);
    const lengthFeet = Math.floor(lengthInches / 12);
    const lengthInchesRem = Math.round(lengthInches % 12);

    const squareFootage = Math.round((widthInches * lengthInches) / 144);

    const warnings: string[] = [];
    if (parsed.ceilingHeight.confidence < 0.7) {
      warnings.push('Ceiling height measurement has low confidence');
    }
    if (parsed.roomWidth.confidence < 0.7) {
      warnings.push('Room width measurement has low confidence');
    }

    const avgConfidence = (
      parsed.ceilingHeight.confidence +
      parsed.roomWidth.confidence +
      parsed.roomLength.confidence
    ) / 3;

    let calibrationQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (avgConfidence > 0.85) calibrationQuality = 'excellent';
    else if (avgConfidence > 0.70) calibrationQuality = 'good';
    else if (avgConfidence > 0.50) calibrationQuality = 'fair';
    else calibrationQuality = 'poor';

    return {
      ceilingHeight: {
        inches: ceilingInches,
        feet: `${ceilingFeet}'${ceilingInchesRem}"`,
        confidence: parsed.ceilingHeight.confidence,
        method: parsed.ceilingHeight.calculationMethod,
        codeCompliance: validateAgainstCodes('ceiling_height', ceilingInches)
      },
      roomDimensions: {
        widthInches,
        lengthInches,
        widthFeet: `${widthFeet}'${widthInchesRem}"`,
        lengthFeet: `${lengthFeet}'${lengthInchesRem}"`,
        squareFootage,
        confidence: avgConfidence
      },
      referenceObjectsUsed: referenceObjects,
      calibrationQuality,
      warnings
    };

  } catch (error) {
    console.error('Error calculating measurements:', error);
    return {
      ceilingHeight: {
        inches: 96,
        feet: "8'0\"",
        confidence: 0.3,
        method: 'error_fallback',
        codeCompliance: { valid: true, message: 'Using standard default' }
      },
      roomDimensions: {
        widthInches: 144,
        lengthInches: 168,
        widthFeet: "12'0\"",
        lengthFeet: "14'0\"",
        squareFootage: 168,
        confidence: 0.2
      },
      referenceObjectsUsed: referenceObjects,
      calibrationQuality: 'poor',
      warnings: ['Calculation error - using defaults']
    };
  }
}

/**
 * Full photogrammetric analysis pipeline
 */
export async function performPhotogrammetricAnalysis(
  imageDataUrl: string
): Promise<SpatialMeasurements> {
  console.log('🔍 Step 1: Detecting reference objects...');
  const referenceObjects = await detectReferenceObjects(imageDataUrl);

  console.log(`✓ Found ${referenceObjects.length} reference objects`);
  referenceObjects.forEach(obj => {
    console.log(`  - ${obj.detectedName} (${(obj.confidence * 100).toFixed(0)}% confidence)`);
  });

  console.log('📐 Step 2: Calculating spatial measurements...');
  const measurements = await calculateSpatialMeasurements(imageDataUrl, referenceObjects);

  console.log(`✓ Ceiling: ${measurements.ceilingHeight.feet} (${measurements.ceilingHeight.confidence * 100}% confidence)`);
  console.log(`✓ Room: ${measurements.roomDimensions.widthFeet} x ${measurements.roomDimensions.lengthFeet}`);
  console.log(`✓ Square footage: ${measurements.roomDimensions.squareFootage} sq ft`);
  console.log(`✓ Calibration quality: ${measurements.calibrationQuality}`);

  return measurements;
}
