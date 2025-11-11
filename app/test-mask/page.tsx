'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface DebugResult {
  analysis: any;
  assessmentPrompt: string;
  maskPrompt: string;
  grayscaleMask: string; // base64
  reconstructedMask: string; // base64
  logs: string[];
}

export default function TestMaskPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Convert to data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedImage(dataUrl);

        // Send to debug API
        const response = await fetch('/api/debug-mask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl: dataUrl }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        setResult(data);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    multiple: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Mask Generation Debug Tool
        </h1>
        <p className="text-gray-600 mb-8">
          Upload an image to test assessment and mask generation with real-time prompt visibility
        </p>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 bg-white hover:border-purple-400'
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="text-purple-600">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Processing...</p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-medium text-gray-700 mb-2">
                {isDragActive ? 'Drop image here' : 'Click or drag image to upload'}
              </p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Results Grid */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Original Image */}
            {uploadedImage && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📸 Original Image</h2>
                <img
                  src={uploadedImage}
                  alt="Original"
                  className="max-w-md mx-auto rounded-lg border border-gray-300"
                />
              </div>
            )}

            {/* Prompts in Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assessment Prompt */}
              <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-4">
                  📋 Assessment Prompt (gemini-2.5-pro)
                </h2>
                <pre className="text-xs bg-blue-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-gray-800">
                  {result.assessmentPrompt}
                </pre>
              </div>

              {/* Mask Generation Prompt */}
              <div className="bg-white rounded-xl border-2 border-green-200 p-6">
                <h2 className="text-xl font-bold text-green-900 mb-4">
                  🎭 Mask Generation Prompt (gemini-2.5-flash-image)
                </h2>
                <pre className="text-xs bg-green-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-gray-800">
                  {result.maskPrompt}
                </pre>
              </div>
            </div>

            {/* Analysis Results */}
            <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
              <h2 className="text-xl font-bold text-purple-900 mb-4">
                🔍 Analysis Results
              </h2>
              <pre className="text-sm bg-purple-50 p-4 rounded-lg overflow-x-auto font-mono text-gray-800">
                {JSON.stringify(result.analysis, null, 2)}
              </pre>
            </div>

            {/* Masks Side-by-Side */}
            <div className="bg-white rounded-xl border-2 border-orange-200 p-6">
              <h2 className="text-xl font-bold text-orange-900 mb-4">
                🎭 Mask Comparison
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Grayscale Mask */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Grayscale Mask (Original from Gemini)
                  </h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <img
                      src={`data:image/png;base64,${result.grayscaleMask}`}
                      alt="Grayscale Mask"
                      className="w-full rounded border border-gray-300"
                    />
                  </div>
                </div>

                {/* Reconstructed Mask */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Reconstructed Binary Mask (After Sharp Processing)
                  </h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <img
                      src={`data:image/png;base64,${result.reconstructedMask}`}
                      alt="Reconstructed Mask"
                      className="w-full rounded border border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Identical Warning */}
              {result.grayscaleMask === result.reconstructedMask && (
                <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                  <p className="text-red-800 font-bold">
                    ⚠️ WARNING: Masks are IDENTICAL! Reconstruction is not working.
                  </p>
                </div>
              )}
            </div>

            {/* Logs */}
            {result.logs && result.logs.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  📝 Processing Logs
                </h2>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
                  {result.logs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
