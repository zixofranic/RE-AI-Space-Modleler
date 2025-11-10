import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check what the room analysis detected
 * GET /api/debug-analysis?imageId=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageId = searchParams.get('imageId');

  if (!imageId) {
    return NextResponse.json({ error: 'imageId required' }, { status: 400 });
  }

  // This would fetch from your store or database
  // For now, return format example
  return NextResponse.json({
    message: 'Check browser console for room analysis data',
    imageId,
    instructions: 'Look for analysis logs when the image was uploaded'
  });
}
