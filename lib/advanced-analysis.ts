import { getAnalysisModel } from './gemini';
import { dataUrlToBase64, getMimeType } from './utils';
import type { RoomAnalysis } from '@/types';

/**
 * Multi-pass analysis for higher accuracy
 */
export async function advancedSpatialAnalysis(
  imageId: string,
  imageDataUrl: string
): Promise<RoomAnalysis> {
  const model = getAnalysisModel();
  const imageBase64 = await dataUrlToBase64(imageDataUrl);
  const mimeType = getMimeType(imageDataUrl);

  // PASS 1: Basic identification
  const pass1Prompt = `Analyze this image and identify:
1. What type of room is this? (Living Room, Bedroom, Kitchen, etc.)
2. What are the PRIMARY architectural features you can see?
3. How many windows are visible?
4. What is the flooring type?

Respond in JSON format:
{
  "roomType": "...",
  "primaryFeatures": ["...", "..."],
  "windowCount": 0,
  "flooringType": "..."
}`;

  const pass1Result = await model.generateContent([
    pass1Prompt,
    { inlineData: { mimeType, data: imageBase64 } }
  ]);

  let pass1Data;
  try {
    const text = pass1Result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    pass1Data = JSON.parse(text);
  } catch {
    pass1Data = { roomType: 'Unknown Room', primaryFeatures: [], windowCount: 0, flooringType: 'Unknown' };
  }

  // PASS 2: Detailed spatial analysis
  const pass2Prompt = `You identified this as a "${pass1Data.roomType}". Now provide DETAILED spatial analysis:

1. **Dimensions**: Estimate room size (small/medium/large, approximate square footage)
2. **Ceiling height**: Standard (8-9ft), High (10-12ft), or Vaulted?
3. **Lighting sources**: Direction of natural light, existing fixtures
4. **Architectural details**: Crown molding, baseboards, door frames, built-ins
5. **Walls**: Color, texture, condition
6. **Connections**: What rooms likely connect to this based on door/opening placement?

Known features: ${pass1Data.primaryFeatures.join(', ')}

Respond in JSON:
{
  "dimensions": {
    "size": "small|medium|large",
    "estimatedSqFt": "100-150",
    "ceilingHeight": "standard|high|vaulted"
  },
  "lighting": {
    "naturalLightDirection": "north|south|east|west|multiple",
    "existingFixtures": ["...", "..."],
    "overallQuality": "bright|moderate|dim"
  },
  "architecturalDetails": ["...", "..."],
  "walls": {
    "color": "...",
    "finish": "painted|wallpaper|textured",
    "condition": "excellent|good|fair|needs work"
  },
  "connections": {
    "likelyConnectedRooms": ["...", "..."],
    "openFloorPlan": true|false
  }
}`;

  const pass2Result = await model.generateContent([
    pass2Prompt,
    { inlineData: { mimeType, data: imageBase64 } }
  ]);

  let pass2Data;
  try {
    const text = pass2Result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    pass2Data = JSON.parse(text);
  } catch {
    pass2Data = {};
  }

  // PASS 3: Comparative analysis (for multi-angle detection)
  const pass3Prompt = `Based on this ${pass1Data.roomType}, identify UNIQUE identifiers that would help recognize this same room from different angles:

1. **Signature features**: Unique elements that would be visible from other angles
2. **Fixed elements**: Windows, doors, built-ins that won't move
3. **Spatial fingerprint**: Combination of features that uniquely identify this space

Respond in JSON:
{
  "signatureFeatures": ["specific fireplace design", "built-in bookshelf", "..."],
  "fixedElements": {
    "windowPositions": "...",
    "doorLocations": "...",
    "permanentFixtures": ["..."]
  },
  "spatialFingerprint": "brief unique description for matching"
}`;

  const pass3Result = await model.generateContent([
    pass3Prompt,
    { inlineData: { mimeType, data: imageBase64 } }
  ]);

  let pass3Data;
  try {
    const text = pass3Result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    pass3Data = JSON.parse(text);
  } catch {
    pass3Data = {};
  }

  // Combine all passes into comprehensive analysis
  return {
    imageId,
    roomType: pass1Data.roomType,
    dimensions: pass2Data.dimensions || {},
    features: [
      ...pass1Data.primaryFeatures,
      ...(pass2Data.architecturalDetails || []),
      ...(pass3Data.signatureFeatures || [])
    ].filter((v, i, a) => a.indexOf(v) === i), // dedupe
    lighting: pass2Data.lighting?.overallQuality || 'Unknown',
    flooring: pass1Data.flooringType,
    windows: pass1Data.windowCount,
    // Extended fields
    detailedLighting: pass2Data.lighting,
    wallInfo: pass2Data.walls,
    connections: pass2Data.connections,
    spatialFingerprint: pass3Data.spatialFingerprint,
    signatureFeatures: pass3Data.signatureFeatures || []
  };
}
