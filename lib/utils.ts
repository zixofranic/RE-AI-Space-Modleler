import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function dataUrlToBase64(dataUrl: string): Promise<string> {
  // Check if it's an HTTP(S) URL (Supabase storage URL)
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    try {
      // Fetch the image from the URL
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // Convert to blob then to base64
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      return base64;
    } catch (error) {
      console.error('Error fetching image from URL:', error);
      throw new Error(`Failed to fetch image from URL: ${dataUrl}`);
    }
  }

  // Original logic for data URLs
  return dataUrl.split(',')[1];
}

export function getMimeType(dataUrl: string): string {
  // Check if it's an HTTP(S) URL (Supabase storage URL)
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    // Extract extension from URL or default to jpeg
    const urlPath = dataUrl.split('?')[0]; // Remove query params
    const ext = urlPath.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
    };

    return ext && mimeTypes[ext] ? mimeTypes[ext] : 'image/jpeg';
  }

  // Original logic for data URLs
  const match = dataUrl.match(/data:([^;]+);/);
  return match ? match[1] : 'image/jpeg';
}
