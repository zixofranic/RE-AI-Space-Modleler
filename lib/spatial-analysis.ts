import type { RoomAnalysis, RoomGroup, UploadedImage } from '@/types';
import { generateId } from './utils';

/**
 * Groups images that appear to be the same room from different angles
 */
export function groupSimilarRooms(analyses: Record<string, RoomAnalysis>): RoomGroup[] {
  const groups: RoomGroup[] = [];
  const grouped = new Set<string>();

  const imageIds = Object.keys(analyses);

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];

    if (grouped.has(imageId)) continue;

    const analysis = analyses[imageId];
    const group: RoomGroup = {
      id: generateId(),
      imageIds: [imageId],
      roomType: analysis.roomType,
      primaryImageId: imageId,
    };

    // Look for other images that might be the same room
    for (let j = i + 1; j < imageIds.length; j++) {
      const otherImageId = imageIds[j];

      if (grouped.has(otherImageId)) continue;

      const otherAnalysis = analyses[otherImageId];

      // Simple similarity check - in production, use more sophisticated matching
      if (isSameRoom(analysis, otherAnalysis)) {
        group.imageIds.push(otherImageId);
        grouped.add(otherImageId);
      }
    }

    grouped.add(imageId);
    groups.push(group);
  }

  return groups;
}

/**
 * Determines if two room analyses represent the same room
 * This is a simplified version - production would use computer vision
 */
function isSameRoom(room1: RoomAnalysis, room2: RoomAnalysis): boolean {
  // Must be same room type
  if (room1.roomType !== room2.roomType) {
    return false;
  }

  // Check for similar features
  const features1 = new Set(room1.features);
  const features2 = new Set(room2.features);

  const commonFeatures = [...features1].filter(f => features2.has(f));
  const totalFeatures = new Set([...features1, ...features2]).size;

  const similarity = commonFeatures.length / totalFeatures;

  // If more than 60% features match, likely same room
  if (similarity > 0.6) {
    // Additional checks
    const sameFlooring = room1.flooring === room2.flooring;
    const similarWindows = Math.abs((room1.windows || 0) - (room2.windows || 0)) <= 1;

    return sameFlooring && similarWindows;
  }

  return false;
}

/**
 * Generates a consistent seed number for a room group
 * This ensures furniture stays consistent across multiple views
 */
export function generateRoomSeed(groupId: string): number {
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    const char = groupId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 1000000;
}

/**
 * Extracts room configuration ID (either imageId or groupId)
 */
export function getRoomConfigId(
  imageId: string,
  groups: RoomGroup[]
): string {
  const group = groups.find(g => g.imageIds.includes(imageId));
  return group ? group.id : imageId;
}

/**
 * Gets all images for a room configuration
 */
export function getRoomImages(
  roomId: string,
  images: UploadedImage[],
  groups: RoomGroup[]
): UploadedImage[] {
  // Check if roomId is a group
  const group = groups.find(g => g.id === roomId);

  if (group) {
    return images.filter(img => group.imageIds.includes(img.id));
  }

  // Otherwise it's a single image
  return images.filter(img => img.id === roomId);
}
