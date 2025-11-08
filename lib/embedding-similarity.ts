import { geminiClient } from './gemini';
import type { RoomAnalysis } from '@/types';

/**
 * Generate embeddings for room comparison
 * Uses Gemini's embedding model for semantic similarity
 */
export async function generateRoomEmbedding(analysis: RoomAnalysis): Promise<number[]> {
  try {
    const embeddingModel = geminiClient.getGenerativeModel({
      model: 'text-embedding-004'
    });

    // Create a rich text description of the room
    const roomDescription = `
Room Type: ${analysis.roomType}
Flooring: ${analysis.flooring}
Windows: ${analysis.windows}
Lighting: ${analysis.lighting}
Features: ${analysis.features.join(', ')}
Dimensions: ${JSON.stringify(analysis.dimensions)}
    `.trim();

    const result = await embeddingModel.embedContent(roomDescription);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

/**
 * Advanced similarity scoring combining multiple signals
 */
export function calculateRoomSimilarity(
  room1: RoomAnalysis,
  room2: RoomAnalysis,
  embedding1?: number[],
  embedding2?: number[]
): number {
  let totalScore = 0;
  let weights = 0;

  // 1. Room type must match (critical)
  if (room1.roomType !== room2.roomType) {
    return 0; // Different room types = definitely not the same room
  }

  // 2. Flooring match (weight: 0.3)
  if (room1.flooring === room2.flooring) {
    totalScore += 0.3;
  }
  weights += 0.3;

  // 3. Window count similarity (weight: 0.25)
  const windowDiff = Math.abs((room1.windows || 0) - (room2.windows || 0));
  const windowScore = Math.max(0, 1 - (windowDiff / 3)); // Allow ±1 window difference
  totalScore += windowScore * 0.25;
  weights += 0.25;

  // 4. Feature overlap (weight: 0.25)
  const features1 = new Set(room1.features.map(f => f.toLowerCase()));
  const features2 = new Set(room2.features.map(f => f.toLowerCase()));
  const intersection = new Set([...features1].filter(x => features2.has(x)));
  const union = new Set([...features1, ...features2]);

  const featureOverlap = union.size > 0 ? intersection.size / union.size : 0;
  totalScore += featureOverlap * 0.25;
  weights += 0.25;

  // 5. Embedding similarity (weight: 0.2) - semantic understanding
  if (embedding1 && embedding2 && embedding1.length > 0 && embedding2.length > 0) {
    const embeddingSim = cosineSimilarity(embedding1, embedding2);
    totalScore += embeddingSim * 0.2;
    weights += 0.2;
  }

  return weights > 0 ? totalScore / weights : 0;
}

/**
 * Smart room grouping using embeddings
 */
export async function groupRoomsWithEmbeddings(
  analyses: Record<string, RoomAnalysis>
): Promise<{ groups: Array<{ imageIds: string[]; similarity: number }> }> {
  const imageIds = Object.keys(analyses);

  // Generate embeddings for all rooms
  const embeddings: Record<string, number[]> = {};

  for (const imageId of imageIds) {
    embeddings[imageId] = await generateRoomEmbedding(analyses[imageId]);
  }

  // Find similar rooms using similarity threshold
  const SIMILARITY_THRESHOLD = 0.65; // 65% similarity
  const groups: Array<{ imageIds: string[]; similarity: number }> = [];
  const processed = new Set<string>();

  for (let i = 0; i < imageIds.length; i++) {
    const imageId1 = imageIds[i];
    if (processed.has(imageId1)) continue;

    const group = [imageId1];
    processed.add(imageId1);

    for (let j = i + 1; j < imageIds.length; j++) {
      const imageId2 = imageIds[j];
      if (processed.has(imageId2)) continue;

      const similarity = calculateRoomSimilarity(
        analyses[imageId1],
        analyses[imageId2],
        embeddings[imageId1],
        embeddings[imageId2]
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        group.push(imageId2);
        processed.add(imageId2);
      }
    }

    if (group.length > 0) {
      groups.push({
        imageIds: group,
        similarity: group.length > 1 ? SIMILARITY_THRESHOLD : 1.0
      });
    }
  }

  return { groups };
}
