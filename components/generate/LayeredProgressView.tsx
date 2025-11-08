'use client';

import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

interface Layer {
  layerNumber: number;
  layerName: string;
  imageUrl?: string;
  success?: boolean;
  error?: string;
}

interface LayeredProgressViewProps {
  layers: Layer[];
  currentLayer: number;
  totalLayers: number;
}

const LAYER_DESCRIPTIONS = [
  {
    number: 1,
    name: 'Space Analysis',
    description: 'Identifying doorways, openings, and safe zones',
    icon: '🗺️',
  },
  {
    number: 2,
    name: 'Layout Planning',
    description: 'Planning furniture placement with boxes',
    icon: '📐',
  },
  {
    number: 3,
    name: 'Styled Furniture',
    description: 'Generating real furniture with your design preferences',
    icon: '🛋️',
  },
  {
    number: 4,
    name: 'Shadows & Lighting',
    description: 'Adding realistic shadows and lighting effects',
    icon: '🌑',
  },
  {
    number: 5,
    name: 'Final Polish',
    description: 'Refining edges and adding final touches',
    icon: '✨',
  },
];

export function LayeredProgressView({
  layers,
  currentLayer,
  totalLayers,
}: LayeredProgressViewProps) {
  const getLayerStatus = (layerNum: number) => {
    const layer = layers.find((l) => l.layerNumber === layerNum);
    if (!layer) {
      if (layerNum < currentLayer) return 'completed';
      if (layerNum === currentLayer) return 'in-progress';
      return 'pending';
    }
    if (layer.success === false) return 'failed';
    if (layer.success === true) return 'completed';
    return 'in-progress';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Layered Generation In Progress
          </h2>
          <p className="text-gray-600">
            Processing Layer {currentLayer} of {totalLayers}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
              style={{
                width: `${(currentLayer / totalLayers) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Start</span>
            <span>{Math.round((currentLayer / totalLayers) * 100)}% Complete</span>
            <span>Finished</span>
          </div>
        </div>

        {/* Layer Steps */}
        <div className="space-y-4">
          {LAYER_DESCRIPTIONS.map((layerInfo) => {
            const status = getLayerStatus(layerInfo.number);
            const layer = layers.find((l) => l.layerNumber === layerInfo.number);

            return (
              <div
                key={layerInfo.number}
                className={`border-2 rounded-xl p-4 transition-all ${
                  status === 'completed'
                    ? 'border-green-300 bg-green-50'
                    : status === 'in-progress'
                    ? 'border-purple-300 bg-purple-50'
                    : status === 'failed'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start">
                  {/* Icon/Status */}
                  <div className="shrink-0 mr-4">
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : status === 'in-progress' ? (
                      <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    ) : status === 'failed' ? (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-2xl mr-2">{layerInfo.icon}</span>
                      <h3 className="font-semibold text-gray-900">
                        Layer {layerInfo.number}: {layerInfo.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {layerInfo.description}
                    </p>

                    {status === 'in-progress' && (
                      <div className="flex items-center text-sm text-purple-700">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </div>
                    )}

                    {status === 'completed' && layer?.imageUrl && (
                      <div className="mt-3">
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-green-700 hover:text-green-800 font-medium">
                            View Layer {layerInfo.number} Result ▼
                          </summary>
                          <div className="mt-2 rounded-lg overflow-hidden border-2 border-green-300">
                            <img
                              src={layer.imageUrl}
                              alt={`Layer ${layerInfo.number} result`}
                              className="w-full"
                            />
                          </div>
                        </details>
                      </div>
                    )}

                    {status === 'failed' && layer?.error && (
                      <div className="mt-2 text-sm text-red-700 bg-red-100 rounded p-2">
                        <strong>Error:</strong> {layer.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Status Message */}
        <div className="mt-6 text-center">
          {currentLayer <= totalLayers ? (
            <p className="text-sm text-gray-600">
              {LAYER_DESCRIPTIONS[currentLayer - 1]?.description}...
            </p>
          ) : (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-900">
                ✅ All layers completed successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
