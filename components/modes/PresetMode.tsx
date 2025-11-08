'use client';

import { PRESETS } from '@/lib/presets';
import { useStore } from '@/lib/store';
import { Check } from 'lucide-react';

export function PresetMode() {
  const { selectedPreset, setPreset, uploadedImages, roomGroups } = useStore();

  const handlePresetSelect = (presetId: string) => {
    setPreset(presetId);

    // Apply preset settings to all rooms
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const roomIds = [
      ...uploadedImages.map((img) => img.id),
      ...roomGroups.map((group) => group.id),
    ];

    // This will be handled in the parent component
    // For now, just set the preset
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Design Style
        </h2>
        <p className="text-gray-600">
          Select a preset to apply consistent styling across all rooms
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className={`
                group relative rounded-2xl overflow-hidden border-3 transition-all
                hover:scale-[1.02] hover:shadow-xl
                ${
                  isSelected
                    ? 'border-purple-600 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300'
                }
              `}
            >
              {/* Thumbnail placeholder */}
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                {/* In production, replace with actual preset images */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {preset.id === 'modern-minimal' && '🏠'}
                      {preset.id === 'warm-cozy' && '🛋️'}
                      {preset.id === 'luxe-elegant' && '💎'}
                      {preset.id === 'scandinavian-bright' && '☀️'}
                      {preset.id === 'industrial-chic' && '🏭'}
                      {preset.id === 'bohemian-eclectic' && '🌿'}
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      {preset.name}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4 bg-purple-600 rounded-full p-2">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 text-left bg-white">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {preset.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {preset.description}
                </p>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Style Highlights:
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>• {preset.settings.designStyle}</div>
                      <div>• {preset.settings.colorPalette}</div>
                      <div>• {preset.settings.atmosphere}</div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedPreset && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 bg-purple-600 rounded-full p-2">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900 mb-1">
                Preset Selected
              </h4>
              <p className="text-purple-700 text-sm">
                The{' '}
                <strong>
                  {PRESETS.find((p) => p.id === selectedPreset)?.name}
                </strong>{' '}
                style will be applied to all rooms. You can customize individual
                rooms in the next step.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
