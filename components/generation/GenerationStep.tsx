'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { PRESETS } from '@/lib/presets';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { LayeredProgressView } from '@/components/generate/LayeredProgressView';
import type { LayerResult } from '@/types';

export function GenerationStep() {
  const {
    uploadedImages,
    roomAnalyses,
    selectedPreset,
    roomConfigs,
    projectStyleGuide,
    enableSpatialConsistency,
    setStagingResult,
    setProjectStyleGuide,
    nextStep,
  } = useStore();

  const [generationStatus, setGenerationStatus] = useState<Record<string, 'pending' | 'processing' | 'complete' | 'error'>>({});
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Layered generation state
  const [currentLayeredImage, setCurrentLayeredImage] = useState<string | null>(null);
  const [layeredLayers, setLayeredLayers] = useState<LayerResult[]>([]);
  const [currentLayer, setCurrentLayer] = useState(1);
  const [useLayered, setUseLayered] = useState(false);

  // Spatial consistency state - track first staged image URL for visual reference
  const [firstStagedImageUrl, setFirstStagedImageUrl] = useState<string | null>(null);

  // Use ref instead of state to persist across React Strict Mode remounts
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate runs (React Strict Mode issue)
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Check if any config has layered generation enabled
    const hasLayered = Object.values(roomConfigs).some(config => config.useLayeredGeneration);
    setUseLayered(hasLayered);
    generateAllStaging();
  }, []);

  const generateAllStaging = async () => {
    const total = uploadedImages.length;
    setProgress({ current: 0, total });

    // Initialize all as pending
    const initialStatus: Record<string, 'pending' | 'processing' | 'complete' | 'error'> = {};
    uploadedImages.forEach(img => {
      initialStatus[img.id] = 'pending';
    });
    setGenerationStatus(initialStatus);

    // Get preset settings
    const preset = PRESETS.find(p => p.id === selectedPreset);
    const globalSettings = preset?.settings || {};

    let currentIndex = 0;

    // Generate staging for each image
    for (const image of uploadedImages) {
      currentIndex++;
      setProgress({ current: currentIndex, total });

      setGenerationStatus(prev => ({ ...prev, [image.id]: 'processing' }));

      try {
        const analysis = roomAnalyses[image.id];
        const config = roomConfigs[image.id] || {
          roomId: image.id,
          mode: 'preset',
          settings: {},
        };

        // Use layered generation if enabled in config
        const endpoint = config.useLayeredGeneration
          ? '/api/generate-staging-layered'
          : '/api/generate-staging';

        // If layered, set current image for progress display
        if (config.useLayeredGeneration) {
          setCurrentLayeredImage(image.id);
          setLayeredLayers([]);
          setCurrentLayer(1);
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: image.id,
            imageDataUrl: image.dataUrl,
            config,
            analysis,
            globalSettings,
            projectStyleGuide, // Include style guide for consistency
            enableSpatialConsistency, // Pass toggle state
            referenceImageUrl: currentIndex > 1 && enableSpatialConsistency ? firstStagedImageUrl : undefined, // 🧪 Visual reference for 2nd+ images
          }),
        });

        if (!response.ok) {
          throw new Error('Generation failed');
        }

        const result = await response.json();

        // Handle layered response
        if (config.useLayeredGeneration && result.layers) {
          // Simulate layer progression (in real implementation, use streaming or polling)
          for (let i = 0; i < result.layers.length; i++) {
            setCurrentLayer(i + 1);
            setLayeredLayers(result.layers.slice(0, i + 1));
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
          }

          // Set final result
          setStagingResult(image.id, {
            imageId: image.id,
            roomType: analysis.roomType,
            description: `Professionally staged ${analysis.roomType}`,
            suggestions: 'Generated using advanced layered approach',
            stagedImageUrl: result.finalImageUrl,
            details: {
              furniturePieces: [],
              colorScheme: '',
              decorElements: [],
              furnitureLayout: '',
              textiles: '',
            },
            layers: result.layers,
            isLayered: true,
          });
        } else {
          // Standard single-pass result
          setStagingResult(image.id, result);
        }

        setGenerationStatus(prev => ({ ...prev, [image.id]: 'complete' }));

        // ============================================================
        // PHASE 1.5: Capture First Staged Image URL for Visual Reference
        // ============================================================
        // If spatial consistency is enabled and this is the first image,
        // save the staged image URL for visual transfer to subsequent images
        if (currentIndex === 1 && enableSpatialConsistency && result.stagedImageUrl) {
          setFirstStagedImageUrl(result.stagedImageUrl);
          console.log('🧪 [Visual Spatial Consistency] First staged image URL captured for visual reference');
          console.log('   Image 2+ will receive this as 4th part in Gemini API call');
        }

        // ============================================================
        // PHASE 2: Extract Style Guide from First Staged Image
        // ============================================================
        // After the FIRST image completes successfully, extract the style guide
        // This creates the "Seed" for the "Seed & Lock" workflow
        if (currentIndex === 1 && !projectStyleGuide && result.stagedImageUrl) {
          try {
            console.log('🔍 [Seed & Lock] Extracting style guide from first staged image...');

            const styleGuideResponse = await fetch('/api/extract-style-guide', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: result.stagedImageUrl,
                imageId: image.id,
              }),
            });

            if (styleGuideResponse.ok) {
              const { styleGuide } = await styleGuideResponse.json();
              console.log('✅ [Seed & Lock] Style guide extracted:', styleGuide);
              setProjectStyleGuide(styleGuide);
              console.log('🔒 [Seed & Lock] Style locked! All subsequent rooms will use these materials.');
            } else {
              console.warn('⚠️ [Seed & Lock] Style guide extraction failed (non-fatal)');
            }
          } catch (extractError) {
            console.error('❌ [Seed & Lock] Error extracting style guide (non-fatal):', extractError);
            // Don't fail generation if style guide extraction fails
          }
        }

      } catch (error) {
        console.error(`Error generating staging for ${image.id}:`, error);
        setGenerationStatus(prev => ({ ...prev, [image.id]: 'error' }));
      }
    }

    // All done - move to results
    setTimeout(() => {
      nextStep();
    }, 1500);
  };

  const completedCount = Object.values(generationStatus).filter(s => s === 'complete').length;
  const errorCount = Object.values(generationStatus).filter(s => s === 'error').length;

  // Show layered progress view if currently processing with layered mode
  if (useLayered && currentLayeredImage && generationStatus[currentLayeredImage] === 'processing') {
    return (
      <LayeredProgressView
        layers={layeredLayers}
        currentLayer={currentLayer}
        totalLayers={5}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-4">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Generating Staged Images
          </h2>
          <p className="text-lg text-gray-600">
            AI is creating professional staging for your rooms...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress.current} of {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Image Status List */}
        <div className="space-y-3">
          {uploadedImages.map((image) => {
            const status = generationStatus[image.id] || 'pending';
            const analysis = roomAnalyses[image.id];

            return (
              <div
                key={image.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 transition-all
                  ${status === 'processing' ? 'border-purple-300 bg-purple-50' : ''}
                  ${status === 'complete' ? 'border-green-300 bg-green-50' : ''}
                  ${status === 'error' ? 'border-red-300 bg-red-50' : ''}
                  ${status === 'pending' ? 'border-gray-200 bg-gray-50' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {analysis?.roomType || 'Room'}
                    </div>
                    <div className="text-sm text-gray-500">{image.name}</div>
                  </div>
                </div>

                <div className="flex items-center">
                  {status === 'pending' && (
                    <span className="text-gray-500 text-sm">Waiting...</span>
                  )}
                  {status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  )}
                  {status === 'complete' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-center space-x-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {progress.total - completedCount - errorCount}
              </div>
              <div className="text-gray-600">Remaining</div>
            </div>
            {errorCount > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-gray-600">Failed</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
