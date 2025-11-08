'use client';

import { useStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Edit2, Check } from 'lucide-react';

const ROOM_TYPES = [
  'Living Room',
  'Master Bedroom',
  'Bedroom',
  'Kitchen',
  'Dining Room',
  'Home Office',
  'Bathroom',
  'Master Bathroom',
  'Entryway',
  'Hallway',
  'Laundry Room',
  'Basement',
  'Attic',
  'Garage',
  'Patio',
  'Balcony',
  'Other',
];

export function RoomTypeEditor() {
  const { uploadedImages, roomAnalyses, setRoomAnalysis } = useStore();

  const handleRoomTypeChange = (imageId: string, newRoomType: string) => {
    const analysis = roomAnalyses[imageId];
    if (analysis) {
      setRoomAnalysis(imageId, {
        ...analysis,
        roomType: newRoomType,
      });
    }
  };

  if (uploadedImages.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Edit2 className="w-5 h-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Room Types
        </h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        AI detected these room types. You can change them if needed to ensure accurate staging.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {uploadedImages.map((image) => {
          const analysis = roomAnalyses[image.id];
          const currentRoomType = analysis?.roomType || 'Unknown';

          return (
            <div
              key={image.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start space-x-3">
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Room Type Selector */}
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`room-${image.id}`} className="text-gray-700 font-medium mb-1 block text-sm">
                    {image.name}
                  </Label>
                  <select
                    id={`room-${image.id}`}
                    value={currentRoomType}
                    onChange={(e) => handleRoomTypeChange(image.id, e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 font-medium bg-white"
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  {/* Analysis confidence indicator */}
                  {analysis && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Check className="w-3 h-3 text-green-600 mr-1" />
                      AI detected
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
