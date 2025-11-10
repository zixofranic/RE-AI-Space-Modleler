import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dataUrlToBase64, getMimeType } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { RoomStagingConfig, RoomAnalysis } from '@/types';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface TestGenerateRequest {
  imageId: string;
  imageDataUrl: string;
  config: RoomStagingConfig;
  analysis: RoomAnalysis;
}

/**
 * Generate floor mask for inpainting (SAME AS MAIN ROUTE)
 */
async function generateFloorMask(imageBase64: string, mimeType: string, imageId: string, analysis: RoomAnalysis, projectId?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    const maskPrompt = `
You are a technical segmentation tool. Your sole task is to generate a new, binary, black-and-white mask based on the provided photo.

Do NOT edit the original photo. You must CREATE A NEW image.

TASK:
1. Start with a new, blank image that is pure BLACK (#000000).
2. Analyze the provided photo to find the floor area (the carpet, hardwood, or tile).
3. Paint ONLY the pixels corresponding to the floor area PURE WHITE (#FFFFFF).
4. The final output must be this new 2-color (black and white) mask.

OUTPUT REQUIREMENTS:
- The output MUST be a binary black-and-white image.
- The output MUST NOT look like the original photo.
- The output MUST have the exact same dimensions as the input.

COLOR RULES:
- WHITE (#FFFFFF): Only the floor surface (carpet, hardwood, tile).
- BLACK (#000000): Everything else (walls, doors, windows, ceiling, ceiling fan, trim, baseboards, etc.).

This is a data file, not a photo. Generate a pure binary mask.
`;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: maskPrompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      }],
    });

    const response = await result.response;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;
      const imagePart = parts.find((part: any) => part.inlineData);

      if (imagePart && imagePart.inlineData) {
        const maskData = imagePart.inlineData.data;
        console.log('✅ TEST: Floor mask generated successfully');

        // DEBUG: Save mask to Supabase for inspection
        if (isSupabaseConfigured() && projectId) {
          try {
            const maskBlob = new Blob([
              Uint8Array.from(atob(maskData), c => c.charCodeAt(0))
            ], { type: 'image/png' });

            const debugPath = `${projectId}/debug/test_mask_${imageId}_${Date.now()}.png`;
            await supabase.storage
              .from('staged-images')
              .upload(debugPath, maskBlob, { upsert: true });

            console.log(`🐛 TEST DEBUG: Mask saved to staged-images/${debugPath}`);
          } catch (debugError) {
            console.warn('⚠️ Could not save debug mask:', debugError);
          }
        }

        return maskData;
      }
    }

    throw new Error('Mask generation failed: No mask image returned from Gemini');

  } catch (error) {
    console.error('❌ Error generating mask:', error);
    throw new Error(`Mask generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TestGenerateRequest = await request.json();

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

    // ============================================================================
    // STEP 1: Generate floor mask
    // ============================================================================
    console.log('🧪 TEST Step 1: Generating floor mask...');
    const maskBase64 = await generateFloorMask(imageBase64, mimeType, body.imageId, body.analysis, body.analysis.projectId);

    // ============================================================================
    // STEP 2: Build SIMPLE staging prompt
    // ============================================================================
    console.log('🧪 TEST Step 2: Building simple prompt...');

    const simplePrompt = `Stage this ${body.analysis.roomType} with ${body.config.settings?.designStyle || 'modern'} furniture.

Simple rules:
- Do not delete or remove doors or windows
- Do not block doors or windows with furniture
- Add furniture only to the floor area

The mask shows where you can edit (white = floor) and where you cannot (black = everything else).
`;

    // ============================================================================
    // STEP 3: Simple 3-part API call
    // ============================================================================
    console.log('🧪 TEST Step 3: Generating with simple prompt (3-part)...');

    const parts: any[] = [
      { text: simplePrompt },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      {
        inlineData: {
          mimeType: 'image/png',
          data: maskBase64,
        },
      },
    ];

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
    });

    const response = await result.response;

    // Extract generated image
    const candidates = response.candidates;
    let stagedImageUrl = body.imageDataUrl;

    if (candidates && candidates.length > 0 && candidates[0].content) {
      const parts = candidates[0].content.parts;
      const imagePart = parts.find((part: any) => part.inlineData);

      if (imagePart && imagePart.inlineData) {
        const generatedMimeType = imagePart.inlineData.mimeType || 'image/jpeg';
        const generatedData = imagePart.inlineData.data;
        stagedImageUrl = `data:${generatedMimeType};base64,${generatedData}`;
        console.log('✅ TEST: Staged image generated successfully');
      }
    }

    const stagingResult = {
      imageId: body.imageId,
      roomType: body.analysis.roomType,
      description: `TEST: Simple staged ${body.analysis.roomType}`,
      suggestions: 'Test staging with minimal prompt',
      stagedImageUrl,
      details: {
        furniturePieces: [],
        colorScheme: '',
        decorElements: [],
        furnitureLayout: '',
        textiles: '',
      },
    };

    return NextResponse.json(stagingResult);

  } catch (error) {
    console.error('❌ TEST: Staging generation error:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Generation failed',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
