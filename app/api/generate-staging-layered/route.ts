import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dataUrlToBase64, getMimeType } from '@/lib/utils';
import type { RoomStagingConfig, RoomAnalysis, DesignSettings, ProjectStyleGuide } from '@/types';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface LayeredGenerateRequest {
  imageId: string;
  imageDataUrl: string;
  config: RoomStagingConfig;
  analysis?: RoomAnalysis;
  projectId?: string; // Project ID for database save
  globalSettings?: Partial<DesignSettings>;
  projectStyleGuide?: ProjectStyleGuide; // "Seed & Lock" style guide
}

interface LayerResult {
  layerNumber: number;
  layerName: string;
  imageUrl: string;
  metadata?: any;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LayeredGenerateRequest = await request.json();

    if (!body.imageDataUrl || !body.config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    const imageBase64 = await dataUrlToBase64(body.imageDataUrl);
    const mimeType = getMimeType(body.imageDataUrl);

    // Provide default analysis if not provided
    const analysis = body.analysis || {
      roomType: 'Room',
      doors: 0,
      windows: 0,
      ceilingHeight: 'Standard',
      wallColor: 'Unknown',
      floorType: 'Unknown',
    };

    const settings = {
      ...body.globalSettings,
      ...body.config.settings,
    };

    const layers: LayerResult[] = [];

    // LAYER 1: Space Analysis & Constraint Detection
    const layer1Result = await executeLayer1(
      model,
      body.imageDataUrl,
      imageBase64,
      mimeType,
      analysis
    );
    layers.push(layer1Result);

    if (!layer1Result.success) {
      return NextResponse.json({ layers, success: false, failedAt: 1 });
    }

    // LAYER 2: Furniture Layout Planning (Boxes)
    const layer2Result = await executeLayer2(
      model,
      layer1Result.imageUrl,
      analysis,
      settings,
      layer1Result.metadata
    );
    layers.push(layer2Result);

    if (!layer2Result.success) {
      return NextResponse.json({ layers, success: false, failedAt: 2 });
    }

    // LAYER 3: Generate Styled Furniture
    const layer3Result = await executeLayer3(
      model,
      layer2Result.imageUrl,
      analysis,
      settings,
      layer2Result.metadata
    );
    layers.push(layer3Result);

    if (!layer3Result.success) {
      return NextResponse.json({ layers, success: false, failedAt: 3 });
    }

    // LAYER 4: Add Shadows & Lighting
    const layer4Result = await executeLayer4(
      model,
      layer3Result.imageUrl,
      analysis,
      layer1Result.metadata
    );
    layers.push(layer4Result);

    if (!layer4Result.success) {
      return NextResponse.json({ layers, success: false, failedAt: 4 });
    }

    // LAYER 5: Final Polish & Integration
    const layer5Result = await executeLayer5(
      model,
      layer4Result.imageUrl,
      body.imageDataUrl
    );
    layers.push(layer5Result);

    return NextResponse.json({
      success: true,
      layers,
      finalImageUrl: layer5Result.imageUrl,
      imageId: body.imageId,
    });

  } catch (error) {
    console.error('Layered staging error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

// LAYER 1: Space Analysis & Constraint Detection
async function executeLayer1(
  model: any,
  originalImageUrl: string,
  imageBase64: string,
  mimeType: string,
  analysis: RoomAnalysis
): Promise<LayerResult> {
  try {
    const prompt = `LAYER 1: SPACE ANALYSIS & CONSTRAINT DETECTION

Analyze this ${analysis.roomType} image and create a constraint map by:

1. IDENTIFY FORBIDDEN ZONES (mark in RED transparent overlay):
   - ALL doorways, archways, and passage openings
   - ALL windows (CRITICAL - furniture must NOT block windows)
   - Areas within 36 inches (3 feet) of any opening or window
   - Walkway corridors between rooms
   - Areas that must remain clear for circulation

2. IDENTIFY SAFE PLACEMENT ZONES (mark in GREEN transparent overlay):
   - Solid wall areas (at least 4 feet from any opening or window)
   - Center of room (if large enough)
   - Areas suitable for furniture placement

3. DETECT LIGHT SOURCES (mark with YELLOW arrows):
   - Mark each window with an arrow showing light direction
   - Mark ceiling fixtures if visible
   - Indicate primary light direction

4. OUTPUT FORMAT:
   Generate the SAME IMAGE with semi-transparent colored overlays:
   - RED overlay = Forbidden zones (no furniture allowed - includes ALL windows and doorways)
   - GREEN overlay = Safe zones (furniture can go here)
   - YELLOW arrows = Light direction

CRITICAL:
- Keep the original image visible underneath
- Use 30% transparency for overlays
- Clearly mark ALL doorways, openings, AND WINDOWS in RED
- Windows must be completely in RED forbidden zones
- Be generous with forbidden zones (safety first)

Generate the constraint map now.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;
      const imagePart = parts.find((part: any) => part.inlineData);

      if (imagePart && imagePart.inlineData) {
        const generatedMimeType = imagePart.inlineData.mimeType || 'image/jpeg';
        const generatedData = imagePart.inlineData.data;
        const constraintMapUrl = `data:${generatedMimeType};base64,${generatedData}`;

        // Try to extract metadata from text response
        const textPart = parts.find((part: any) => part.text);
        let metadata: any = {};

        if (textPart?.text) {
          // Parse any JSON or structured data from response
          try {
            const jsonMatch = textPart.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              metadata = JSON.parse(jsonMatch[0]);
            }
          } catch {
            metadata = { rawText: textPart.text };
          }
        }

        return {
          layerNumber: 1,
          layerName: 'Space Analysis & Constraints',
          imageUrl: constraintMapUrl,
          metadata: {
            ...metadata,
            lightSourceCount: analysis.windows || 0,
            roomType: analysis.roomType,
          },
          success: true,
        };
      }
    }

    throw new Error('No image generated in Layer 1');
  } catch (error) {
    return {
      layerNumber: 1,
      layerName: 'Space Analysis & Constraints',
      imageUrl: originalImageUrl,
      success: false,
      error: error instanceof Error ? error.message : 'Layer 1 failed',
    };
  }
}

// LAYER 2: Furniture Layout Planning (Simple Boxes)
async function executeLayer2(
  model: any,
  constraintMapUrl: string,
  analysis: RoomAnalysis,
  settings: Partial<DesignSettings>,
  layer1Metadata: any
): Promise<LayerResult> {
  try {
    const imageBase64 = await dataUrlToBase64(constraintMapUrl);
    const mimeType = getMimeType(constraintMapUrl);

    const prompt = `LAYER 2: FURNITURE LAYOUT PLANNING

Using the constraint map from Layer 1, create a furniture layout using SIMPLE COLORED BOXES.

ROOM TYPE: ${analysis.roomType}
DESIGN STYLE: ${settings.designStyle || 'Contemporary'}

FURNITURE TO PLACE (as colored rectangles):

Living Room Standard Layout:
- BLUE BOX: Sofa (84" × 36") - 7 feet wide
- ORANGE BOX: Coffee Table (48" × 24") - 4 feet wide
- PURPLE BOX: Armchair (32" × 34") - under 3 feet (place 1 or 2)
- BROWN BOX: Side Table (20" × 20") - 2 feet
- BEIGE BOX: Area Rug (8' × 10' or 9' × 12')

PLACEMENT RULES:
1. Place boxes ONLY in GREEN safe zones from Layer 1
2. NEVER place boxes in RED forbidden zones (doorways, windows, openings)
3. Keep ALL boxes at least 36" from doorways, windows, and openings
4. Windows must remain completely unobstructed - NEVER block windows with furniture
5. Orient boxes logically (sofa against wall, facing room)
6. Maintain 30" walking paths between boxes

VALIDATION:
- Count all doorways, windows, and openings in RED zones
- Verify NO boxes overlap with RED zones (especially windows)
- Verify all windows are completely clear of furniture
- Verify boxes have realistic spacing

OUTPUT:
Generate the image with:
- Original room with constraint overlays (faded)
- Colored rectangular boxes showing furniture placement
- Each box labeled with furniture type and dimensions
- All boxes in safe zones only

Generate the layout plan now.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;
      const imagePart = parts.find((part: any) => part.inlineData);

      if (imagePart && imagePart.inlineData) {
        const generatedMimeType = imagePart.inlineData.mimeType || 'image/jpeg';
        const generatedData = imagePart.inlineData.data;
        const layoutPlanUrl = `data:${generatedMimeType};base64,${generatedData}`;

        return {
          layerNumber: 2,
          layerName: 'Furniture Layout Planning',
          imageUrl: layoutPlanUrl,
          metadata: {
            furnitureCount: 5, // This should be parsed from response
            validated: true,
          },
          success: true,
        };
      }
    }

    throw new Error('No image generated in Layer 2');
  } catch (error) {
    return {
      layerNumber: 2,
      layerName: 'Furniture Layout Planning',
      imageUrl: constraintMapUrl,
      success: false,
      error: error instanceof Error ? error.message : 'Layer 2 failed',
    };
  }
}

// LAYER 3: Generate Styled Furniture
async function executeLayer3(
  model: any,
  layoutPlanUrl: string,
  analysis: RoomAnalysis,
  settings: Partial<DesignSettings>,
  layer2Metadata: any
): Promise<LayerResult> {
  try {
    const imageBase64 = await dataUrlToBase64(layoutPlanUrl);
    const mimeType = getMimeType(layoutPlanUrl);

    const prompt = `LAYER 3: GENERATE STYLED FURNITURE

Replace the colored boxes from Layer 2 with actual styled furniture.

CRITICAL RULES:
1. Use EXACT same positions and sizes as the boxes
2. Do NOT move or resize furniture from box positions
3. Each box becomes real furniture with the SAME dimensions

DESIGN PREFERENCES:
- Style: ${settings.designStyle || 'Contemporary'}
- Color Palette: ${settings.colorPalette || 'Neutral tones'}
- Furniture Style: ${settings.furnitureStyle || 'Modern, clean-lined'}
- Atmosphere: ${settings.atmosphere || 'Warm and inviting'}

FURNITURE REPLACEMENT:
- BLUE BOX → Real sofa (same position, 84"W)
- ORANGE BOX → Real coffee table (same position, 48"W)
- PURPLE BOX → Real armchair(s) (same positions, 32"W each)
- BROWN BOX → Real side table (same position, 20"W)
- BEIGE BOX → Real area rug (same position and size)

IMPORTANT:
- Do NOT add shadows yet (that's Layer 4)
- Furniture should look flat/basic (no lighting effects yet)
- Keep exact positions from Layer 2
- Maintain all clearances from forbidden zones
- Verify all windows remain completely unobstructed
- Do NOT add any furniture that blocks windows or doorways

Generate the styled furniture now.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;
      const imagePart = parts.find((part: any) => part.inlineData);

      if (imagePart && imagePart.inlineData) {
        const generatedMimeType = imagePart.inlineData.mimeType || 'image/jpeg';
        const generatedData = imagePart.inlineData.data;
        const styledUrl = `data:${generatedMimeType};base64,${generatedData}`;

        return {
          layerNumber: 3,
          layerName: 'Styled Furniture Generation',
          imageUrl: styledUrl,
          success: true,
        };
      }
    }

    throw new Error('No image generated in Layer 3');
  } catch (error) {
    return {
      layerNumber: 3,
      layerName: 'Styled Furniture Generation',
      imageUrl: layoutPlanUrl,
      success: false,
      error: error instanceof Error ? error.message : 'Layer 3 failed',
    };
  }
}

// LAYER 4: Add Shadows & Lighting
async function executeLayer4(
  model: any,
  styledFurnitureUrl: string,
  analysis: RoomAnalysis,
  layer1Metadata: any
): Promise<LayerResult> {
  try {
    const imageBase64 = await dataUrlToBase64(styledFurnitureUrl);
    const mimeType = getMimeType(styledFurnitureUrl);

    const windowCount = analysis.windows || 0;
    const lightDirection = windowCount > 0
      ? `Natural light from ${windowCount} window(s) - shadows cast away from windows`
      : 'Artificial ceiling lighting - observe existing room shadows';

    const prompt = `LAYER 4: ADD SHADOWS & LIGHTING

Add realistic shadows to ALL furniture from Layer 3.

LIGHT SOURCE: ${lightDirection}

SHADOW REQUIREMENTS:

For EVERY piece of furniture, add these 3 shadow types:

1. CONTACT SHADOW (ESSENTIAL):
   - Dark shadow directly where furniture touches floor
   - This is the MOST IMPORTANT shadow (prevents floating look)
   - Darkest at the exact contact point
   - Example: Dark line beneath sofa base, around chair legs

2. CAST SHADOW:
   - Soft shadow extending away from light source
   - Direction: Match window/light position
   - Softer edges for natural light
   - Example: Sofa casts shadow behind it (away from window)

3. CREVICE DARKENING:
   - Darker areas where parts meet
   - Under armrests, in cushion seams, behind furniture
   - Makes furniture look three-dimensional

SHADOW QUALITY:
- All shadows must point the SAME direction
- Consistent intensity across all furniture
- Natural darkness (not pure black)
- Softer near windows, sharper far from windows

DO NOT:
- Change furniture positions
- Change furniture colors or styles
- Move or resize anything
- Add new furniture

ONLY add shadows to existing furniture.

Generate the shadowed version now.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;
      const imagePart = parts.find((part: any) => part.inlineData);

      if (imagePart && imagePart.inlineData) {
        const generatedMimeType = imagePart.inlineData.mimeType || 'image/jpeg';
        const generatedData = imagePart.inlineData.data;
        const shadowedUrl = `data:${generatedMimeType};base64,${generatedData}`;

        return {
          layerNumber: 4,
          layerName: 'Shadows & Lighting',
          imageUrl: shadowedUrl,
          success: true,
        };
      }
    }

    throw new Error('No image generated in Layer 4');
  } catch (error) {
    return {
      layerNumber: 4,
      layerName: 'Shadows & Lighting',
      imageUrl: styledFurnitureUrl,
      success: false,
      error: error instanceof Error ? error.message : 'Layer 4 failed',
    };
  }
}

// LAYER 5: Final Polish & Integration
async function executeLayer5(
  model: any,
  shadowedUrl: string,
  originalImageUrl: string
): Promise<LayerResult> {
  try {
    const imageBase64 = await dataUrlToBase64(shadowedUrl);
    const mimeType = getMimeType(shadowedUrl);

    const prompt = `LAYER 5: FINAL POLISH & INTEGRATION

Apply final polish to create a photorealistic staged image.

FINAL REFINEMENTS:

1. Edge Blending:
   - Smooth edges where furniture meets floor
   - Natural integration of shadows
   - No harsh cutouts or obvious compositing

2. Color Harmony:
   - Ensure furniture colors complement the room
   - Match lighting color temperature
   - Natural color balance

3. Detail Enhancement:
   - Add subtle texture to fabrics
   - Ensure realistic material appearance
   - Add any missing small details (cushions, books, decor)

4. Quality Check:
   - All shadows present and realistic
   - No floating furniture
   - All doorways, windows, and openings still clear
   - All windows completely unobstructed
   - Natural, photorealistic appearance

DO NOT:
- Move or resize furniture
- Add new large furniture pieces
- Block any doorways, windows, or openings
- Change the overall layout

ONLY refine and polish what's already there.

Generate the final polished image now.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;
      const imagePart = parts.find((part: any) => part.inlineData);

      if (imagePart && imagePart.inlineData) {
        const generatedMimeType = imagePart.inlineData.mimeType || 'image/jpeg';
        const generatedData = imagePart.inlineData.data;
        const finalUrl = `data:${generatedMimeType};base64,${generatedData}`;

        return {
          layerNumber: 5,
          layerName: 'Final Polish',
          imageUrl: finalUrl,
          success: true,
        };
      }
    }

    throw new Error('No image generated in Layer 5');
  } catch (error) {
    return {
      layerNumber: 5,
      layerName: 'Final Polish',
      imageUrl: shadowedUrl,
      success: false,
      error: error instanceof Error ? error.message : 'Layer 5 failed',
    };
  }
}
