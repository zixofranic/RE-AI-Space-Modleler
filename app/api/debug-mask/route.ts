import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dataUrlToBase64, getMimeType } from '@/lib/utils';
import sharp from 'sharp';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const logs: string[] = [];

  function log(message: string) {
    console.log(message);
    logs.push(message);
  }

  try {
    const body = await request.json();
    const { imageDataUrl } = body;

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const imageBase64 = await dataUrlToBase64(imageDataUrl);
    const mimeType = getMimeType(imageDataUrl);

    log('🔍 Starting debug analysis...');
    log(`📊 Image: mimeType=${mimeType}, base64Length=${imageBase64.length}`);

    // ============================================================================
    // STEP 1: ANALYSIS (gemini-2.5-pro)
    // ============================================================================
    log('🔍 STEP 1: Running analysis with gemini-2.5-pro...');

    const analysisModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const assessmentPrompt = `Analyze this room photo and provide a structured assessment.

TASK: Identify key architectural and spatial elements for virtual staging planning.

OUTPUT FORMAT (JSON):
{
  "roomType": "Bedroom" | "Living Room" | "Dining Room" | "Kitchen" | "Bathroom" | "Home Office",
  "doors": number (count all doors including closet doors),
  "windows": number,
  "features": ["feature1", "feature2", ...],
  "floorType": "hardwood" | "carpet" | "tile" | "laminate",
  "dimensions": {
    "estimated": "small" | "medium" | "large"
  }
}

CRITICAL: Count ALL doors visible in the image, including:
- Entry doors
- Closet doors (single and double)
- French doors
- Pocket doors
- Any door frame or door visible

Return ONLY valid JSON, no markdown formatting.`;

    const analysisResult = await analysisModel.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: assessmentPrompt },
          { inlineData: { mimeType, data: imageBase64 } }
        ]
      }]
    });

    const analysisText = analysisResult.response.text();
    log(`✅ Analysis complete: ${analysisText.substring(0, 100)}...`);

    const analysis = JSON.parse(analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    log(`📋 Detected: ${analysis.roomType}, ${analysis.doors} doors, ${analysis.windows} windows`);

    // ============================================================================
    // STEP 2: MASK GENERATION (gemini-2.5-flash-image)
    // ============================================================================
    log('🎭 STEP 2: Generating mask with gemini-2.5-flash-image...');

    const maskModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    const doors = analysis.doors || 0;
    const windows = analysis.windows || 0;

    const maskPrompt = `Create a mask from this ${analysis.roomType} photo.

Step 1: Make everything in the image solid black (#000000).

Step 2: Now find ONLY the floor area (the carpet/hardwood/tile at the bottom where people walk). Paint ONLY this floor area solid white (#FFFFFF).

Result: The floor is white. Everything else (walls, ceiling, doors, windows, furniture, ceiling fan) remains black.

This is a ${analysis.roomType} with ${doors} door(s) and ${windows} window(s). The doors and windows must stay black, not white.`;

    const maskResult = await maskModel.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: maskPrompt },
          { inlineData: { mimeType, data: imageBase64 } }
        ]
      }]
    });

    const maskResponse = await maskResult.response;
    const candidates = maskResponse.candidates;

    if (!candidates || candidates.length === 0) {
      throw new Error('No mask generated');
    }

    const parts = candidates[0].content.parts;
    const imagePart = parts.find((part: any) => part.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      throw new Error('No image data in mask response');
    }

    const grayscaleMask = imagePart.inlineData.data;
    log(`✅ Grayscale mask generated: ${grayscaleMask.length} bytes`);

    // ============================================================================
    // STEP 3: INTELLIGENT MASK RECONSTRUCTION (Sharp)
    // ============================================================================
    log('🔧 STEP 3: Reconstructing binary mask with Sharp...');

    let reconstructedMask = grayscaleMask; // Default to original

    try {
      const grayscaleMaskBuffer = Buffer.from(grayscaleMask, 'base64');
      const metadata = await sharp(grayscaleMaskBuffer).metadata();
      const { width, height } = metadata;

      log(`🔧 Original mask dimensions: ${width}x${height}`);

      if (width && height) {
        // Create pure black canvas
        const blackCanvas = await sharp({
          create: {
            width,
            height,
            channels: 3,
            background: { r: 0, g: 0, b: 0 }
          }
        }).png().toBuffer();

        log('🔧 Created pure black canvas');

        // Extract white floor and composite onto black canvas
        const finalMaskBuffer = await sharp(blackCanvas)
          .composite([{
            input: grayscaleMaskBuffer,
            blend: 'lighten'
          }])
          .threshold(254)
          .png()
          .toBuffer();

        reconstructedMask = finalMaskBuffer.toString('base64');
        log(`✅ Reconstructed mask created: ${reconstructedMask.length} bytes`);

        // Check if they're identical
        if (reconstructedMask === grayscaleMask) {
          log('⚠️ WARNING: Reconstructed mask is IDENTICAL to grayscale mask!');
        } else {
          log('✅ SUCCESS: Masks are different!');
        }
      }
    } catch (error) {
      log(`❌ Reconstruction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // ============================================================================
    // RETURN DEBUG RESULTS
    // ============================================================================
    return NextResponse.json({
      analysis,
      assessmentPrompt,
      maskPrompt,
      grayscaleMask,
      reconstructedMask,
      logs
    });

  } catch (error) {
    log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Debug failed',
        logs
      },
      { status: 500 }
    );
  }
}
