'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PresetMode } from './PresetMode';
import { GuidedMode } from './GuidedMode';
import { ExpertMode } from './ExpertMode';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function CustomizeView() {
  const {
    selectedMode,
    applySettingsToAllRooms,
    uploadedImages,
    roomAnalyses,
    enableSpatialConsistency,
    toggleSpatialConsistency,
  } = useStore();
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
          {/* Experimental Features Toggle */}
          {uploadedImages.length > 1 && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-300 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        🧪 Spatial Consistency (Experimental)
                      </h3>
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                        BETA
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">
                      When enabled, the AI will try to maintain consistent furniture scale and style across multiple images of the same space.
                    </p>
                    <p className="text-xs text-gray-700">
                      <strong>How it works:</strong> The first image establishes furniture dimensions and style. Subsequent images use this as reference to maintain consistency.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={enableSpatialConsistency || false}
                      onChange={(e) => toggleSpatialConsistency(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    <span className="ml-3 text-sm font-bold text-gray-900">
                      {enableSpatialConsistency ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </div>
                {enableSpatialConsistency && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-xs text-gray-900 font-medium">
                      ✓ Active: First image will set the style guide. Subsequent images will maintain consistency.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

      {/* Preset Selector */}
      {selectedMode === 'preset' && <PresetMode />}

      {/* Guided Mode - Questionnaire */}
      {selectedMode === 'guided' && <GuidedMode />}

      {/* Expert Mode - Full Control */}
      {selectedMode === 'expert' && <ExpertMode />}

      {/* Custom Details Section - Available for ALL modes */}
      {selectedMode && (
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="custom-requests" className="text-lg font-bold text-gray-900">
              ✨ Additional Details & Custom Requests
            </Label>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
              Optional
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            Add any specific requests, preferences, or details to refine your staging. The AI will incorporate these alongside your {selectedMode === 'preset' ? 'preset' : selectedMode} settings.
          </p>

          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold text-gray-900 mb-2">💡 Examples:</p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• "Add a fireplace mantel with decorative items"</li>
              <li>• "Include a home office setup with desk and bookshelf"</li>
              <li>• "Pet-friendly furniture with washable fabrics"</li>
              <li>• "Children's bedroom with toy storage"</li>
              <li>• "Add indoor plants in corners"</li>
              <li>• "Include a reading nook by the window"</li>
              <li>• "Coastal-inspired color accents"</li>
            </ul>
          </div>

          <Textarea
            id="custom-requests"
            placeholder="Type your custom staging requests here... Be as specific or general as you like. Multiple requests are welcome!"
            value={customRequests}
            onChange={(e) => handleCustomRequestsChange(e.target.value)}
            rows={6}
            className="w-full resize-none text-base border-gray-300 focus:border-purple-400 focus:ring-purple-400"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-500">
              {customRequests.length} characters
            </div>
            {customRequests.length > 0 && (
              <button
                onClick={() => handleCustomRequestsChange('')}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
