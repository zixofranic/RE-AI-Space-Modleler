'use client';

import { useState } from 'react';
import { Sparkles, Compass, Settings2, Layers } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { DesignMode } from '@/types';

const modes: Array<{
  id: DesignMode;
  name: string;
  description: string;
  icon: typeof Sparkles;
  recommended?: boolean;
}> = [
  {
    id: 'preset',
    name: 'Presets',
    description: 'Choose from 6 professional design styles. Perfect for quick staging.',
    icon: Sparkles,
    recommended: true,
  },
  {
    id: 'guided',
    name: 'Guided Mode',
    description: 'Answer 10-20 questions per room for customized designs.',
    icon: Compass,
  },
  {
    id: 'expert',
    name: 'Expert Mode',
    description: 'Full control over every design parameter and detail.',
    icon: Settings2,
  },
];

export function ModeSelector() {
  const { selectedMode, setMode, applySettingsToAllRooms } = useStore();
  const [useLayeredGeneration, setUseLayeredGeneration] = useState(true);

  const handleLayeredToggle = (enabled: boolean) => {
    setUseLayeredGeneration(enabled);
    // Apply to all room configs
    applySettingsToAllRooms({ useLayeredGeneration: enabled } as any);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Choose Your Design Approach
        </h2>
        <p className="text-lg text-gray-800">
          Select how you'd like to create your virtual staging
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id)}
              className={`
                relative p-8 rounded-2xl border-3 text-left transition-all
                hover:scale-[1.02] hover:shadow-xl
                ${
                  isSelected
                    ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }
              `}
            >
              {mode.recommended && (
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Recommended
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div
                  className={`
                  w-16 h-16 rounded-xl flex items-center justify-center
                  ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600'
                      : 'bg-gray-100'
                  }
                `}
                >
                  <Icon
                    className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-700'}`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {mode.name}
                  </h3>
                  <p className="text-gray-800 leading-relaxed">
                    {mode.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="pt-4">
                    <div className="flex items-center text-purple-600 font-semibold">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Selected
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Layered Generation Toggle */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Layers className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Layered Generation (Experimental)
              </h3>
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                NEW
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Uses a 5-layer approach for higher quality and reliability. Each layer is validated before proceeding:
            </p>
            <ul className="mt-2 text-sm text-gray-800 space-y-1">
              <li className="flex items-center">
                <span className="text-blue-600 mr-2">1.</span> Space Analysis & Constraint Detection
              </li>
              <li className="flex items-center">
                <span className="text-blue-600 mr-2">2.</span> Furniture Layout Planning (boxes)
              </li>
              <li className="flex items-center">
                <span className="text-blue-600 mr-2">3.</span> Generate Styled Furniture
              </li>
              <li className="flex items-center">
                <span className="text-blue-600 mr-2">4.</span> Add Shadows & Lighting
              </li>
              <li className="flex items-center">
                <span className="text-blue-600 mr-2">5.</span> Final Polish & Integration
              </li>
            </ul>
            <p className="mt-2 text-xs text-blue-700">
              ⏱️ Takes longer but produces more reliable results with better doorway detection and shadow quality.
            </p>
          </div>

          <div className="ml-6">
            <button
              onClick={() => handleLayeredToggle(!useLayeredGeneration)}
              className={`
                relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                ${useLayeredGeneration ? 'bg-blue-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                  ${useLayeredGeneration ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
            <div className="text-center mt-1">
              <span className={`text-xs font-semibold ${useLayeredGeneration ? 'text-blue-600' : 'text-gray-700'}`}>
                {useLayeredGeneration ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
