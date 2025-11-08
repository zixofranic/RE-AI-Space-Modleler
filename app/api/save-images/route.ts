import { NextRequest, NextResponse } from 'next/server';
import { saveProject, saveImage } from '@/lib/database';

interface SaveImagesRequest {
  projectId: string;
  projectName?: string;
  projectAddress?: string;
  images: Array<{
    id: string;
    originalUrl: string;
    thumbnailUrl?: string;
    analysis?: any;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveImagesRequest = await request.json();

    if (!body.projectId || !body.images || body.images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId and images' },
        { status: 400 }
      );
    }

    // 1. Save/update project (using upsert to prevent duplicates)
    const projectResult = await saveProject(body.projectId, {
      name: body.projectName || `Project ${new Date().toLocaleDateString()}`,
      address: body.projectAddress,
      metadata: {
        imageCount: body.images.length,
        lastUpdated: new Date().toISOString(),
      }
    });

    console.log(`✅ Project ${projectResult.success ? 'saved' : 'already exists'}: ${body.projectId}`);

    // 2. Save all images
    const savedImages = [];
    for (const image of body.images) {
      try {
        const result = await saveImage({
          id: image.id,
          projectId: body.projectId,
          originalUrl: image.originalUrl,
          thumbnailUrl: image.thumbnailUrl,
          analysis: image.analysis || {},
          metadata: {
            uploadedAt: new Date().toISOString(),
          }
        });
        savedImages.push(result.data);
        console.log(`✅ Image saved: ${image.id}`);
      } catch (imageError) {
        console.error(`⚠️ Failed to save image ${image.id}:`, imageError);
      }
    }

    return NextResponse.json({
      success: true,
      projectId: body.projectId,
      savedCount: savedImages.length,
      data: savedImages,
    });

  } catch (error) {
    console.error('❌ Save images error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save images',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
