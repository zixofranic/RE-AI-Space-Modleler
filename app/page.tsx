'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { RoomTypeEditor } from '@/components/upload/RoomTypeEditor';
import { PropertySelector } from '@/components/upload/PropertySelector';
import { ModeSelector } from '@/components/modes/ModeSelector';
import { CustomizeView } from '@/components/modes/CustomizeView';
import { GenerationStep } from '@/components/generation/GenerationStep';
import { ResultsView } from '@/components/results/ResultsView';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles, FolderOpen } from 'lucide-react';
import { groupSimilarRooms } from '@/lib/spatial-analysis';
import { setupSupabaseStorage } from '@/lib/setup-storage';

export default function Home() {
  const {
    currentStep,
    uploadedImages,
    roomAnalyses,
    selectedMode,
    selectedPreset,
    projectId,
    currentProperty,
    setStep,
    nextStep,
    previousStep,
    setRoomAnalysis,
    setRoomGroups,
    isProcessing,
    setProcessing,
    setError,
  } = useStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedCount, setLastAnalyzedCount] = useState(0);

  // Initialize Supabase storage buckets on app startup
  useEffect(() => {
    const initStorage = async () => {
      const result = await setupSupabaseStorage();
      if (result.success) {
        console.log('✅ Supabase storage initialized');
      } else if (result.error !== 'Supabase not configured') {
        console.warn('⚠️ Storage setup issue:', result.error);
      }
    };
    initStorage();
  }, []);

  // Auto-analyze images when uploaded
  useEffect(() => {
    const analyzeImages = async () => {
      // Prevent duplicate runs - only analyze if:
      // 1. There are images
      // 2. Not currently analyzing
      // 3. The count has changed since last analysis (allows new batches)
      if (uploadedImages.length === 0 || isAnalyzing || uploadedImages.length === lastAnalyzedCount) return;

      setIsAnalyzing(true);
      setLastAnalyzedCount(uploadedImages.length); // Track what we analyzed
      setProcessing(true);

      try {
        const response = await fetch('/api/analyze-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: projectId, // Include projectId so analyses include it
            images: uploadedImages.map((img) => ({
              id: img.id,
              name: img.name,
              dataUrl: img.dataUrl,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze images');
        }

        const { analyses } = await response.json();

        // Set analyses
        Object.entries(analyses).forEach(([imageId, analysis]: [string, any]) => {
          setRoomAnalysis(imageId, analysis);
        });

        // Group similar rooms
        const groups = groupSimilarRooms(analyses);
        setRoomGroups(groups);

        // Save to database (only if we have a projectId from the store)
        if (projectId) {
          try {
            // Prepare images data for database
            const imagesData = uploadedImages.map((img) => {
              const analysis = analyses[img.id];
              return {
                id: img.id,
                originalUrl: img.dataUrl, // This should be Supabase URL if uploaded
                analysis: analysis,
              };
            });

            // Save to database
            const saveResponse = await fetch('/api/save-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: projectId,
                projectName: currentProperty?.name || `Project ${new Date().toLocaleDateString()}`,
                projectAddress: currentProperty?.address,
                images: imagesData,
              }),
            });

            if (saveResponse.ok) {
              const saveResult = await saveResponse.json();
              console.log(`✅ Saved ${saveResult.savedCount} images to database for project ${projectId}`);
            } else {
              console.warn('⚠️ Failed to save images to database (non-fatal)');
            }
          } catch (dbError) {
            console.error('⚠️ Database save error (non-fatal):', dbError);
            // Don't fail the analysis if database save fails
          }
        }

      } catch (error) {
        console.error('Analysis error:', error);
        setError(error instanceof Error ? error.message : 'Analysis failed');
      } finally {
        setIsAnalyzing(false);
        setProcessing(false);
      }
    };

    analyzeImages();
  }, [uploadedImages.length]); // Only trigger when count changes

  const canProceedFromUpload = uploadedImages.length > 0 && !isProcessing;
  const canProceedFromMode = selectedMode !== undefined;
  const canProceedFromPreset = selectedMode !== 'preset' || selectedPreset !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-3 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Virtual Staging
                </h1>
                <p className="text-sm text-gray-800">
                  Professional real estate staging powered by AI
                </p>
              </div>
            </div>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center space-x-4">
            {[
              { id: 'upload', label: 'Upload Images' },
              { id: 'mode', label: 'Select Mode' },
              { id: 'customize', label: 'Customize' },
              { id: 'generate', label: 'Generate' },
              { id: 'results', label: 'Results' },
            ].map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                    ${
                      currentStep === step.id
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-gray-700'
                    }
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm
                      ${
                        currentStep === step.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }
                    `}
                  >
                    {index + 1}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {index < 4 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Upload Your Room Photos
                </h2>
                <p className="text-lg text-gray-800">
                  Add all the empty room images you want to stage
                </p>
              </div>

              <PropertySelector />

              <ImageUploader />

              {isAnalyzing && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        Analyzing Images...
                      </h4>
                      <p className="text-blue-900 text-sm">
                        AI is detecting room types and spatial features
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Room Type Editor - Shows after analysis */}
              {!isAnalyzing && uploadedImages.length > 0 && Object.keys(roomAnalyses).length > 0 && (
                <RoomTypeEditor />
              )}

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={() => nextStep()}
                  disabled={!canProceedFromUpload}
                >
                  Continue to Design Mode
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Mode Selection */}
          {currentStep === 'mode' && (
            <div className="space-y-8">
              <ModeSelector />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => previousStep()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={() => nextStep()}
                  disabled={!canProceedFromMode}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Customize with Preset/Guided/Expert + Custom Requests */}
          {currentStep === 'customize' && (
            <div className="space-y-8">
              <CustomizeView />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => previousStep()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={() => nextStep()}
                  disabled={!canProceedFromPreset}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  Generate Staging
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Generate Staging */}
          {currentStep === 'generate' && <GenerationStep />}

          {/* Step 5: Results */}
          {currentStep === 'results' && <ResultsView />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-gray-800 text-sm">
            Powered by Google Gemini AI | © 2024 Virtual Staging AI
          </p>
        </div>
      </footer>
    </div>
  );
}
