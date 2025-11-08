'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ImageDebuggerProps {
  imageUrl: string;
  label: string;
}

export function ImageDebugger({ imageUrl, label }: ImageDebuggerProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [imageInfo, setImageInfo] = useState<any>(null);

  useEffect(() => {
    const checkImage = async () => {
      setStatus('loading');
      console.log(`[ImageDebugger] Checking ${label}:`, imageUrl);

      // Check if it's a data URL or external URL
      if (imageUrl.startsWith('data:')) {
        console.log(`[${label}] Is a data URL`);
        const parts = imageUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'unknown';
        const dataLength = parts[1]?.length || 0;

        setImageInfo({
          type: 'Data URL',
          mimeType: mime,
          dataLength,
          estimatedSize: Math.round(dataLength * 0.75) // Base64 to bytes approximation
        });

        // Try to decode and check if it's actually black
        try {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(img.width, 10);
            canvas.height = Math.min(img.height, 10);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const pixels = imageData.data;

              // Check if all pixels are black
              let allBlack = true;
              for (let i = 0; i < pixels.length; i += 4) {
                if (pixels[i] > 10 || pixels[i + 1] > 10 || pixels[i + 2] > 10) {
                  allBlack = false;
                  break;
                }
              }

              setImageInfo((prev: any) => ({
                ...prev,
                dimensions: `${img.width}x${img.height}`,
                isAllBlack: allBlack,
                samplePixels: [
                  { r: pixels[0], g: pixels[1], b: pixels[2], a: pixels[3] },
                  { r: pixels[4], g: pixels[5], b: pixels[6], a: pixels[7] }
                ]
              }));

              if (allBlack) {
                setErrorDetails('Image appears to be all black pixels');
              }
              setStatus('success');
            }
          };
          img.onerror = (e) => {
            console.error(`[${label}] Failed to load data URL:`, e);
            setStatus('error');
            setErrorDetails('Failed to decode data URL');
          };
          img.src = imageUrl;
        } catch (e) {
          console.error(`[${label}] Error processing data URL:`, e);
          setErrorDetails(String(e));
          setStatus('error');
        }
      } else {
        // External URL (likely Supabase)
        console.log(`[${label}] Is an external URL`);

        try {
          // Try to fetch the image
          const response = await fetch(imageUrl, { method: 'HEAD' });

          setImageInfo({
            type: 'External URL',
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
            cors: response.headers.get('access-control-allow-origin')
          });

          if (response.ok) {
            // Try to load in an image element
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              console.log(`[${label}] Image loaded successfully`);
              setImageInfo((prev: any) => ({
                ...prev,
                dimensions: `${img.width}x${img.height}`
              }));
              setStatus('success');
            };
            img.onerror = (e) => {
              console.error(`[${label}] Image failed to load:`, e);
              setStatus('error');
              setErrorDetails('Image element failed to load');
            };
            img.src = imageUrl;
          } else {
            setStatus('error');
            setErrorDetails(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (e) {
          console.error(`[${label}] Fetch error:`, e);
          setStatus('error');
          setErrorDetails(`Fetch failed: ${e}`);
        }
      }
    };

    if (imageUrl) {
      checkImage();
    }
  }, [imageUrl, label]);

  const testDirectDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      console.log(`[${label}] Downloaded blob:`, {
        size: blob.size,
        type: blob.type
      });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-${label}-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(`[${label}] Download test failed:`, e);
      alert(`Download failed: ${e}`);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{label} Debug Info</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${
          status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      </div>

      <div className="text-xs space-y-1">
        <div className="font-mono break-all">
          URL: {imageUrl.substring(0, 100)}...
        </div>

        {imageInfo && (
          <div className="space-y-1">
            <div>Type: {imageInfo.type}</div>
            {imageInfo.dimensions && <div>Dimensions: {imageInfo.dimensions}</div>}
            {imageInfo.mimeType && <div>MIME: {imageInfo.mimeType}</div>}
            {imageInfo.dataLength && <div>Data Length: {imageInfo.dataLength}</div>}
            {imageInfo.contentType && <div>Content-Type: {imageInfo.contentType}</div>}
            {imageInfo.isAllBlack !== undefined && (
              <div className={imageInfo.isAllBlack ? 'text-red-600 font-bold' : ''}>
                All Black Pixels: {imageInfo.isAllBlack ? 'YES - IMAGE IS BLACK!' : 'No'}
              </div>
            )}
            {imageInfo.samplePixels && (
              <div>
                Sample Pixels:
                {imageInfo.samplePixels.map((p: any, i: number) => (
                  <span key={i} className="ml-2">
                    rgb({p.r},{p.g},{p.b})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {errorDetails && (
          <div className="text-red-600">
            Error: {errorDetails}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={testDirectDownload}
        >
          Test Download
        </Button>
      </div>
    </div>
  );
}