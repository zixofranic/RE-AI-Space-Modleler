import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisModel } from '@/lib/gemini';
import { dataUrlToBase64, getMimeType } from '@/lib/utils';
import { buildSpatialAnalysisPrompt } from '@/lib/spatial-training';
import { generateRoomEmbedding, groupRoomsWithEmbeddings } from '@/lib/embedding-similarity';
import { requestQueue } from '@/lib/request-queue';
import type { RoomAnalysis } from '@/types';

export const maxDuration = 300; // Increase timeout for queued requests

interface AnalyzeRequest {
  projectId?: string;
  images: Array<{
    id: string;
    name: string;
    dataUrl: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    const model = getAnalysisModel();
    const analyses: Record<string, RoomAnalysis> = {};

    // Analyze all images using request queue to avoid rate limiting
    console.log(`Analyzing ${body.images.length} images (queued to respect rate limits)...`);

    // Create all analysis tasks
    const analysisTasks = body.images.map((image) => {
      return requestQueue.add(async () => {
        try {
          const imageBase64 = await dataUrlToBase64(image.dataUrl);
          const mimeType = getMimeType(image.dataUrl);

          // Debug logging
          console.log('📊 Analysis debug:', {
            hasDataUrl: !!image.dataUrl,
            dataUrlLength: image.dataUrl?.length,
            mimeType,
            base64Length: imageBase64?.length,
          });

          if (!imageBase64 || !mimeType) {
            throw new Error(`Invalid image data: mimeType=${mimeType}, base64Length=${imageBase64?.length}`);
          }

          // Build enhanced prompt with few-shot learning
          const fewShotPrompt = buildSpatialAnalysisPrompt();

          const prompt = `${fewShotPrompt}

Analyze this room image and provide detailed information.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just valid JSON):
{
  "roomType": "specific room type (e.g., Living Room, Master Bedroom, Kitchen)",
  "dimensions": {
    "estimated": "small/medium/large",
    "estimatedSqFt": "100-150",
    "ceilingHeight": "standard/high/vaulted"
  },
  "features": ["feature1", "feature2", "feature3"],
  "lighting": "description of natural and existing artificial lighting",
  "flooring": "flooring type and condition",
  "windows": 2,
  "walls": "wall condition and color",
  "architecturalDetails": ["detail1", "detail2"],
  "signatureFeatures": ["unique identifying features for this specific room"],
  "spatialNotes": "observations about room connections and layout"
}

Focus on:
- ACCURATE room type identification using examples above
- Exact room dimensions and ceiling height estimates
- ALL architectural features (moldings, built-ins, fireplace, etc.)
- Window count, size, and placement
- Flooring material and condition
- Wall features and existing paint/wallpaper
- Natural lighting direction and quality
- UNIQUE features that identify THIS specific room (for multi-angle matching)`;

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
          let text = response.text().trim();

          // Clean markdown code blocks
          text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

          const analysisData = JSON.parse(text);

          const analysis: RoomAnalysis = {
            imageId: image.id,
            projectId: body.projectId, // Include projectId from request
            roomType: analysisData.roomType || 'Unknown Room',
            dimensions: analysisData.dimensions,
            features: analysisData.features || [],
            lighting: analysisData.lighting || '',
            flooring: analysisData.flooring || '',
            windows: analysisData.windows || 0,
          };

          console.log(`✓ Analyzed ${image.name}: ${analysis.roomType}`);
          return { id: image.id, analysis };

        } catch (error) {
          console.error(`Error analyzing image ${image.id}:`, error);
          // Provide fallback analysis
          return {
            id: image.id,
            analysis: {
              imageId: image.id,
              projectId: body.projectId,
              roomType: 'Room',
              features: [],
              lighting: 'Unknown',
              flooring: 'Unknown',
              windows: 0,
            }
          };
        }
      }, `analyze-${image.id}`);
    });

    // Wait for all analyses to complete
    const results = await Promise.all(analysisTasks);

    // Build the analyses object
    for (const result of results) {
      analyses[result.id] = result.analysis;
    }

    return NextResponse.json({ analyses });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
