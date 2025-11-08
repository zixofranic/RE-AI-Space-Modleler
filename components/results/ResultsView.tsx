'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhotoViewer } from '@/components/ui/photo-viewer';
import { CollectionsView } from '@/components/collections/CollectionsView';
import { Download, ArrowLeft, ImageIcon, Sparkles, Edit3, Loader2, Maximize2, FolderOpen } from 'lucide-react';
import { MAX_VERSIONS_PER_IMAGE } from '@/types';
import JSZip from 'jszip';

export function ResultsView() {
  const { uploadedImages, stagingResults, roomAnalyses, projectId, reset, setStagingResult } = useStore();
  const [activeTab, setActiveTab] = useState<'results' | 'collections'>('results');
  const [selectedImage, setSelectedImage] = useState<string | null>(
    uploadedImages[0]?.id || null
  );
  const [editMode, setEditMode] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<Array<{src: string; alt: string; filename?: string}>>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const selectedResults = selectedImage ? (stagingResults[selectedImage] || []) : [];
  const selectedResult = selectedResults[selectedVersionIndex] || null;
  const selectedOriginal = uploadedImages.find(img => img.id === selectedImage);
  const selectedAnalysis = selectedImage ? roomAnalyses[selectedImage] : null;
  const canEdit = selectedResults.length < MAX_VERSIONS_PER_IMAGE;
  const editsUsed = Math.max(0, selectedResults.length - 1); // Subtract 1 because first is initial
  const editsRemaining = Math.max(0, (MAX_VERSIONS_PER_IMAGE - 1) - editsUsed); // Max 3 edits

  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    try {
      const zip = new JSZip();

      // Create folder name with current date and hour
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      const zipFileName = `staged-images-${year}-${month}-${day}-${hour}${minute}.zip`;

      // Add each staged image to the ZIP (all versions)
      for (const image of uploadedImages) {
        const results = stagingResults[image.id] || [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result?.stagedImageUrl) {
            // Convert data URL to blob
            const base64Response = await fetch(result.stagedImageUrl);
            const blob = await base64Response.blob();

            // Add to ZIP with version number if multiple versions exist
            const filename = results.length > 1
              ? `staged-${image.name.replace(/\.[^/.]+$/, '')}-v${i + 1}${image.name.match(/\.[^/.]+$/)?.[0] || '.jpg'}`
              : `staged-${image.name}`;
            zip.file(filename, blob);
          }
        }
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download the ZIP
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(link.href);

      alert(`✅ Downloaded ${uploadedImages.length} images as ${zipFileName}`);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('❌ Failed to create ZIP file. Please try downloading images individually.');
    }
  };

  const handleEditImage = async () => {
    if (!selectedImage || !selectedResult || !editInstruction.trim()) {
      alert('Please enter an edit instruction.');
      return;
    }

    setIsEditing(true);

    try {
      console.log('Sending edit request:', editInstruction.trim());

      const response = await fetch('/api/edit-staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl: selectedResult.stagedImageUrl || selectedOriginal?.dataUrl,
          editInstruction: editInstruction.trim(),
          roomType: selectedResult.roomType,
        }),
      });

      const data = await response.json();
      console.log('Edit response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Edit failed');
      }

      if (data.success && data.editedImageUrl) {
        // Check if the image actually changed
        if (data.editedImageUrl === (selectedResult.stagedImageUrl || selectedOriginal?.dataUrl)) {
          alert('⚠️ Warning: The AI returned the same image. The edit may not have been applied. Try being more specific in your instruction.');
        } else {
          alert('✅ Edit applied successfully!');
        }

        const newResult = {
          ...selectedResult,
          stagedImageUrl: data.editedImageUrl,
        };

        // Add new version to results array (saves to store and Supabase)
        setStagingResult(selectedImage, newResult);

        // Also save to database
        if (projectId) {
          try {
            const versionNumber = selectedResults.length; // This will be the new version number
            const resultId = `${selectedImage}-v${versionNumber}`;

            await fetch('/api/save-staging-result', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: resultId,
                imageId: selectedImage,
                projectId: projectId,
                stagedUrl: data.editedImageUrl,
                description: selectedResult.description,
                suggestions: selectedResult.suggestions,
                roomType: selectedResult.roomType,
                details: selectedResult.details,
              }),
            });
            console.log('✅ Edit saved to database');
          } catch (dbError) {
            console.error('⚠️ Failed to save edit to database (non-fatal):', dbError);
          }
        }

        // Select the newly added version
        setSelectedVersionIndex(selectedResults.length); // New version will be at the end

        // Clear input and exit edit mode
        setEditInstruction('');
        setEditMode(false);
      } else {
        throw new Error('No edited image returned');
      }

    } catch (error) {
      console.error('Error editing image:', error);
      alert(`❌ Edit failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with a more specific instruction.`);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex bg-white rounded-lg border-2 border-gray-200 p-1">
          <button
            onClick={() => setActiveTab('results')}
            className={`
              flex items-center px-6 py-2 rounded-md font-medium transition-all
              ${activeTab === 'results'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Results
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`
              flex items-center px-6 py-2 rounded-md font-medium transition-all
              ${activeTab === 'collections'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Collections
          </button>
        </div>
      </div>

      {/* Collections View */}
      {activeTab === 'collections' && <CollectionsView />}

      {/* Results View */}
      {activeTab === 'results' && (
        <>
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Your Staged Images Are Ready!
            </h2>
            <p className="text-lg text-gray-600">
              View and download your professionally staged room photos
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              onClick={handleDownloadAll}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All Images
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => reset()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Start New Project
            </Button>
          </div>
        </>
      )}

      {activeTab === 'results' && (
        <>
          {/* Image Thumbnails */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Image to View
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {uploadedImages.map((image) => {
            const results = stagingResults[image.id] || [];
            const latestResult = results[results.length - 1]; // Show latest version in thumbnail
            const analysis = roomAnalyses[image.id];

            return (
              <div
                key={image.id}
                className={`
                  group relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                  ${selectedImage === image.id
                    ? 'border-purple-600 ring-4 ring-purple-200'
                    : 'border-gray-200 hover:border-purple-300'
                  }
                `}
              >
                <button
                  onClick={() => {
                    setSelectedImage(image.id);
                    setSelectedVersionIndex(Math.max(0, results.length - 1)); // Select latest version
                  }}
                  className="w-full h-full"
                >
                  <img
                    src={latestResult?.stagedImageUrl || image.dataUrl}
                    alt={analysis?.roomType || 'Room'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {analysis?.roomType || 'Room'}
                      {results.length > 1 && <span className="ml-1">({results.length})</span>}
                    </p>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Include all versions in viewer
                    const viewerImgs = [
                      { src: image.dataUrl, alt: `${analysis?.roomType || 'Room'} - Before`, filename: `original-${image.name}` },
                      ...results.map((r, idx) => ({
                        src: r.stagedImageUrl || image.dataUrl,
                        alt: `${analysis?.roomType || 'Room'} - After v${idx + 1}`,
                        filename: `staged-${image.name.replace(/\.[^/.]+$/, '')}-v${idx + 1}${image.name.match(/\.[^/.]+$/)?.[0] || '.jpg'}`
                      }))
                    ];
                    setViewerImages(viewerImgs);
                    setViewerIndex(latestResult?.stagedImageUrl ? viewerImgs.length - 1 : 0);
                    setPhotoViewerOpen(true);
                  }}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1.5 rounded-full transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                  title="View full screen"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Before/After Comparison */}
      {selectedResult && selectedOriginal && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Before</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(selectedOriginal.dataUrl, `original-${selectedOriginal.name}`)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
              <div
                className="relative cursor-pointer group"
                onClick={() => {
                  setViewerImages([
                    { src: selectedOriginal.dataUrl, alt: 'Before - Original', filename: `original-${selectedOriginal.name}` },
                    { src: selectedResult.stagedImageUrl || selectedOriginal.dataUrl, alt: 'After - Staged', filename: `staged-${selectedOriginal.name}` }
                  ]);
                  setViewerIndex(0);
                  setPhotoViewerOpen(true);
                }}
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 transition-all group-hover:border-purple-400 group-hover:shadow-lg">
                  <img
                    src={selectedOriginal.dataUrl}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                  {/* Maximize icon - top right corner */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                      <Maximize2 className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* After */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    After - Staged
                  </h3>
                  {selectedResults.length > 1 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Version {selectedVersionIndex + 1} of {selectedResults.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!editMode && canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditMode(true)}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit ({editsRemaining} left)
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleDownload(
                      selectedResult.stagedImageUrl || selectedOriginal.dataUrl,
                      `staged-${selectedOriginal.name}`
                    )}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Version Selector */}
              {selectedResults.length > 1 && (
                <div className="mb-3 flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-600">Version:</span>
                  {selectedResults.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVersionIndex(idx)}
                      className={`
                        px-3 py-1 rounded-lg text-sm font-medium transition-all
                        ${selectedVersionIndex === idx
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}
              <div
                className="relative cursor-pointer group"
                onClick={() => {
                  setViewerImages([
                    { src: selectedOriginal.dataUrl, alt: 'Before - Original', filename: `original-${selectedOriginal.name}` },
                    { src: selectedResult.stagedImageUrl || selectedOriginal.dataUrl, alt: 'After - Staged', filename: `staged-${selectedOriginal.name}` }
                  ]);
                  setViewerIndex(1);
                  setPhotoViewerOpen(true);
                }}
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-purple-300 transition-all group-hover:border-purple-500 group-hover:shadow-lg">
                  <img
                    src={selectedResult.stagedImageUrl || selectedOriginal.dataUrl}
                    alt="Staged"
                    className="w-full h-full object-cover"
                  />
                  {/* Maximize icon - top right corner */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                      <Maximize2 className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>


              {/* Edit Mode */}
              {editMode && (
                <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-900 flex items-center">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit This Image ({editsRemaining} edit{editsRemaining !== 1 ? 's' : ''} remaining)
                    </h4>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditInstruction('');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={isEditing}
                    >
                      Cancel
                    </button>
                  </div>

                  {isEditing && (
                    <div className="mb-3 bg-white border border-blue-300 rounded p-3 flex items-center">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-3" />
                      <div>
                        <p className="font-medium text-blue-900">Processing your edit...</p>
                        <p className="text-sm text-blue-700">This may take 10-15 seconds. Please wait.</p>
                      </div>
                    </div>
                  )}

                  <Textarea
                    placeholder="Describe what you want to change... Examples:&#10;• Remove the bookshelf&#10;• Change sofa to blue&#10;• Add a coffee table&#10;• Move the rug to the left"
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    rows={3}
                    className="mb-3"
                    disabled={isEditing}
                  />

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-blue-700">
                      ⚠️ Architecture (walls, openings, windows) cannot be changed
                    </div>
                    <Button
                      onClick={handleEditImage}
                      disabled={isEditing || !editInstruction.trim()}
                      size="sm"
                    >
                      {isEditing ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Editing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-2" />
                          Apply Edit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!canEdit && (
                <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-amber-900 font-medium">
                    Maximum {MAX_VERSIONS_PER_IMAGE} Versions Reached
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    This image has reached the limit of 1 initial + 3 edits
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">
              {selectedResult.roomType}
            </h4>
            <p className="text-gray-700 mb-4">{selectedResult.description}</p>

            {selectedResult.suggestions && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <h5 className="font-medium text-purple-900 mb-2">Design Notes:</h5>
                <p className="text-purple-800 text-sm">{selectedResult.suggestions}</p>
              </div>
            )}

            {selectedAnalysis && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-900">Flooring:</span>
                  <span className="ml-2 font-medium">{selectedAnalysis.flooring}</span>
                </div>
                <div>
                  <span className="text-gray-900">Windows:</span>
                  <span className="ml-2 font-medium">{selectedAnalysis.windows}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {/* Photo Viewer */}
      <PhotoViewer
        images={viewerImages}
        initialIndex={viewerIndex}
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
      />
    </div>
  );
}
