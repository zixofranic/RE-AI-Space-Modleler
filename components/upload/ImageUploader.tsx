'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Save, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateId } from '@/lib/utils';
import type { UploadedImage } from '@/types';
import { Button } from '@/components/ui/button';

export function ImageUploader() {
  const { uploadedImages, addImages, removeImage, reset } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsProcessing(true);

      const newImages: UploadedImage[] = [];

      for (const file of acceptedFiles) {
        const reader = new FileReader();

        await new Promise((resolve, reject) => {
          reader.onload = () => {
            const dataUrl = reader.result as string;
            console.log('📸 Loaded image:', file.name, 'DataURL length:', dataUrl?.length);
            console.log('DataURL preview (first 100 chars):', dataUrl?.substring(0, 100));

            if (dataUrl) {
              newImages.push({
                id: generateId(),
                file,  // IMPORTANT: We're keeping the original File object
                dataUrl,
                name: file.name,
              });
            } else {
              console.error('❌ Failed to load image:', file.name);
            }
            resolve(null);
          };

          reader.onerror = () => {
            console.error('❌ FileReader error:', file.name);
            reject(reader.error);
          };

          reader.readAsDataURL(file);
        });
      }

      console.log('✅ Adding', newImages.length, 'images to store');
      addImages(newImages);
      setIsProcessing(false);
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    multiple: true,
  });

  const handleClearAll = () => {
    if (confirm('⚠️ This will delete all uploaded images and generated results. Are you sure?')) {
      reset();
      // Clear localStorage
      localStorage.removeItem('ai-staging-storage');
      alert('✅ All project data cleared!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Indicator & Clear Button */}
      {uploadedImages.length > 0 && (
        <div className="flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
              <Save className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-900">Project Auto-Saved</p>
              <p className="text-sm text-green-700">
                Your images and results are saved in your browser. You can close this tab and come back later.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`
          border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? 'border-purple-600 bg-purple-50 scale-[1.02]'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          <div className="p-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full">
            <Upload className="w-12 h-12 text-purple-600" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragActive ? 'Drop images here' : 'Upload Room Photos'}
            </h3>
            <p className="text-gray-800">
              Drag and drop multiple images, or click to browse
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Supports: PNG, JPG, JPEG, WebP
            </p>
          </div>

          {!isDragActive && (
            <Button size="lg" className="mt-4">
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-800">Processing images...</p>
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Images ({uploadedImages.length})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {uploadedImages.map((image) => {
              console.log('🖼️ Rendering image:', image.name, 'Has dataUrl:', !!image.dataUrl);

              return (
                <div
                  key={image.id}
                  className="group border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg hover:border-purple-400 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      onLoad={(e) => console.log('✅ Image loaded:', image.name)}
                      onError={(e) => console.error('❌ Image failed to load:', image.name, 'src:', image.dataUrl?.substring(0, 50))}
                    />

                    {/* Delete button - only on hover, positioned in top-right */}
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <p className="text-xs text-gray-700 truncate font-medium">{image.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
