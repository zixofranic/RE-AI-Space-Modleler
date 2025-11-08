'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PresetMode } from './PresetMode';
import { GuidedMode } from './GuidedMode';
import { ExpertMode } from './ExpertMode';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function CustomizeView() {
  const { selectedMode, applySettingsToAllRooms, uploadedImages, roomAnalyses } = useStore();
  const [customRequests, setCustomRequests] = useState('');

  const handleCustomRequestsChange = (value: string) => {
    setCustomRequests(value);
    // Apply to all rooms
    applySettingsToAllRooms({
      customAdditions: value,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sticky Photo Sidebar */}
      {uploadedImages.length > 0 && (
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Rooms ({uploadedImages.length})
            </h3>
            <div className="space-y-3">
              {uploadedImages.slice(0, 3).map((image) => {
                const analysis = roomAnalyses[image.id];
                return (
                  <div
                    key={image.id}
                    className="relative rounded-lg overflow-hidden border-2 border-gray-200"
                  >
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <p className="text-white text-sm font-medium">
                        {analysis?.roomType || 'Room'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {uploadedImages.length > 3 && (
                <p className="text-sm text-gray-600 text-center">
                  +{uploadedImages.length - 3} more room{uploadedImages.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className={uploadedImages.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
        <div className="space-y-8">
      {/* Preset Selector */}
      {selectedMode === 'preset' && (
        <>
          <PresetMode />

          {/* Custom Requests for Preset Mode */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <Label htmlFor="custom-requests" className="text-lg font-semibold text-gray-900 mb-2 block">
              Custom Requests (Optional)
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              Add any specific requests or preferences for your staging. For example: "Add a fireplace mantel", "Include children's toys in bedroom", "Modern farmhouse style kitchen"
            </p>
            <Textarea
              id="custom-requests"
              placeholder="Type your custom staging requests here... (e.g., 'Add a home office setup', 'Include pet-friendly furniture', 'Coastal color palette')"
              value={customRequests}
              onChange={(e) => handleCustomRequestsChange(e.target.value)}
              rows={5}
              className="w-full resize-none text-base"
            />
            <div className="mt-2 text-xs text-gray-500">
              {customRequests.length} characters
            </div>
          </div>
        </>
      )}

      {/* Guided Mode - Questionnaire */}
      {selectedMode === 'guided' && <GuidedMode />}

      {/* Expert Mode - Full Control */}
      {selectedMode === 'expert' && <ExpertMode />}
        </div>
      </div>
    </div>
  );
}
