import { NextRequest, NextResponse } from 'next/server';
import { performPhotogrammetricAnalysis } from '@/lib/photogrammetric-analysis';

export const maxDuration = 60;

interface SpatialAnalysisRequest {
  imageUrl?: string;
  imageDataUrl?: string;
}

/**
 * Advanced spatial analysis API using photogrammetry
 */
export async function POST(request: NextRequest) {
  try {
    const body: SpatialAnalysisRequest = await request.json();

    let imageDataUrl: string;

    // Handle both image URLs and data URLs
    if (body.imageUrl) {
      // Fetch the image from URL
      const imageResponse = await fetch(body.imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      imageDataUrl = `data:${contentType};base64,${base64}`;
    } else if (body.imageDataUrl) {
      imageDataUrl = body.imageDataUrl;
    } else {
      return NextResponse.json(
        { error: 'No image provided (imageUrl or imageDataUrl required)' },
        { status: 400 }
      );
    }

    console.log('🏠 Starting photogrammetric spatial analysis...');

    // Perform the analysis
    const measurements = await performPhotogrammetricAnalysis(imageDataUrl);

    // Format response with rich metadata
    const response = {
      success: true,
      measurements,
      metadata: {
        analysisMethod: 'photogrammetric_reference_objects',
        timestamp: new Date().toISOString(),
        accuracy: measurements.calibrationQuality,
        referenceObjectsCount: measurements.referenceObjectsUsed.length
      },
      summary: {
        ceilingHeight: measurements.ceilingHeight.feet,
        roomSize: `${measurements.roomDimensions.widthFeet} x ${measurements.roomDimensions.lengthFeet}`,
        squareFootage: `${measurements.roomDimensions.squareFootage} sq ft`,
        confidence: `${(measurements.roomDimensions.confidence * 100).toFixed(0)}%`,
        codeCompliant: measurements.ceilingHeight.codeCompliance.valid
      },
      recommendations: generateRecommendations(measurements)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Spatial analysis error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed',
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * Generate design recommendations based on measurements
 */
function generateRecommendations(measurements: any): string[] {
  const recommendations: string[] = [];

  // Ceiling height recommendations
  if (measurements.ceilingHeight.inches < 96) {
    recommendations.push('⚠️ Low ceiling height - use low-profile furniture and avoid tall pieces');
    recommendations.push('💡 Light colors and vertical lines will make space feel taller');
  } else if (measurements.ceilingHeight.inches > 108) {
    recommendations.push('✨ High ceilings - can use tall furniture and statement lighting');
    recommendations.push('🎨 Consider dramatic curtains or tall artwork');
  }

  // Room size recommendations
  const sqft = measurements.roomDimensions.squareFootage;
  if (sqft < 100) {
    recommendations.push('📏 Small room - focus on multi-functional furniture and minimalism');
  } else if (sqft > 300) {
    recommendations.push('🏠 Large room - can accommodate substantial furniture and defined zones');
  }

  // Confidence warnings
  if (measurements.calibrationQuality === 'fair' || measurements.calibrationQuality === 'poor') {
    recommendations.push('⚠️ Measurement confidence is low - consider professional measurements');
  }

  // Code compliance
  if (!measurements.ceilingHeight.codeCompliance.valid) {
    recommendations.push(`🚫 ${measurements.ceilingHeight.codeCompliance.message}`);
  }

  return recommendations;
}
