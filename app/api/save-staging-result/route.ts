import { NextRequest, NextResponse } from 'next/server';
import { saveStagingResult } from '@/lib/database';

interface SaveStagingResultRequest {
  id: string;
  imageId: string;
  projectId: string;
  stagedUrl: string;
  description?: string;
  suggestions?: string;
  roomType?: string;
  details?: any;
  config?: any;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveStagingResultRequest = await request.json();

    if (!body.id || !body.imageId || !body.projectId || !body.stagedUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: id, imageId, projectId, stagedUrl' },
        { status: 400 }
      );
    }

    // Save staging result to database
    const result = await saveStagingResult({
      id: body.id,
      imageId: body.imageId,
      projectId: body.projectId,
      stagedUrl: body.stagedUrl,
      config: body.config,
      description: body.description || '',
      suggestions: body.suggestions || '',
      details: body.details || { roomType: body.roomType },
      metadata: body.metadata || {
        savedAt: new Date().toISOString(),
        isEdit: true,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save staging result' },
        { status: 500 }
      );
    }

    console.log(`✅ Staging result saved: ${body.id} for image ${body.imageId}`);

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('❌ Save staging result error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save staging result',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
