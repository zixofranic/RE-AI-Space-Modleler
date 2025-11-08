/**
 * Computer Vision pre-processing for spatial analysis
 * Uses traditional CV techniques to extract features before AI analysis
 */

export interface CVFeatures {
  dominantColors: string[];
  edgeMap: string; // Base64 edge detection
  brightness: number;
  contrast: number;
  aspectRatio: number;
  symmetry: number;
  verticalLines: number; // Likely windows/doors
  horizontalLines: number; // Likely floor/ceiling
}

/**
 * Extract computer vision features from image
 * This runs BEFORE Gemini to give it more context
 */
export async function extractCVFeatures(imageDataUrl: string): Promise<CVFeatures> {
  // In Node.js environment, you'd use 'canvas' or 'sharp'
  // For now, this is a placeholder showing the concept

  return {
    dominantColors: [],
    edgeMap: '',
    brightness: 0,
    contrast: 0,
    aspectRatio: 0,
    symmetry: 0,
    verticalLines: 0,
    horizontalLines: 0
  };
}

/**
 * Compare two rooms using CV features for similarity
 * Returns 0-1 score (higher = more similar)
 */
export function compareCVFeatures(features1: CVFeatures, features2: CVFeatures): number {
  let similarity = 0;
  let weights = 0;

  // Aspect ratio similarity (weight: 0.2)
  const aspectDiff = Math.abs(features1.aspectRatio - features2.aspectRatio);
  similarity += (1 - Math.min(aspectDiff, 1)) * 0.2;
  weights += 0.2;

  // Brightness similarity (weight: 0.15)
  const brightnessDiff = Math.abs(features1.brightness - features2.brightness);
  similarity += (1 - Math.min(brightnessDiff / 100, 1)) * 0.15;
  weights += 0.15;

  // Vertical lines (windows/doors) similarity (weight: 0.3)
  const verticalDiff = Math.abs(features1.verticalLines - features2.verticalLines);
  similarity += (1 - Math.min(verticalDiff / 5, 1)) * 0.3;
  weights += 0.3;

  // Horizontal lines (floor/ceiling) similarity (weight: 0.2)
  const horizontalDiff = Math.abs(features1.horizontalLines - features2.horizontalLines);
  similarity += (1 - Math.min(horizontalDiff / 5, 1)) * 0.2;
  weights += 0.2;

  // Symmetry similarity (weight: 0.15)
  const symmetryDiff = Math.abs(features1.symmetry - features2.symmetry);
  similarity += (1 - symmetryDiff) * 0.15;
  weights += 0.15;

  return similarity / weights;
}

/**
 * Enhanced prompt that includes CV features
 */
export function buildCVEnhancedPrompt(cvFeatures: CVFeatures): string {
  return `
COMPUTER VISION PRE-ANALYSIS:
- Aspect Ratio: ${cvFeatures.aspectRatio.toFixed(2)} (${cvFeatures.aspectRatio > 1.3 ? 'wide room' : 'square room'})
- Brightness: ${cvFeatures.brightness}/100 (${cvFeatures.brightness > 70 ? 'bright' : cvFeatures.brightness > 40 ? 'moderate' : 'dim'})
- Vertical Features Detected: ${cvFeatures.verticalLines} (likely windows/doors)
- Horizontal Features: ${cvFeatures.horizontalLines} (floor/ceiling lines)
- Symmetry Score: ${cvFeatures.symmetry.toFixed(2)} (${cvFeatures.symmetry > 0.7 ? 'symmetric' : 'asymmetric'})

Use this information to inform your spatial analysis.`;
}
