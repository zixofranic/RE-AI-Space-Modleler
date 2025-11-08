'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { PhotoViewer } from '@/components/ui/photo-viewer';
import { Download, FolderOpen, Image as ImageIcon, Trash2, Grid, List, Maximize2 } from 'lucide-react';
import JSZip from 'jszip';

interface Collection {
  id: string;
  name: string;
  createdAt: Date;
  imageCount: number;
  thumbnailUrl?: string;
}

export function CollectionsView() {
  const { uploadedImages, stagingResults, roomAnalyses, projectId } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<Array<{src: string; alt: string; filename?: string}>>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Create a collection from current session
  const currentCollection: Collection = {
    id: projectId || 'current',
    name: `Project ${new Date().toLocaleDateString()}`,
    createdAt: new Date(),
    imageCount: uploadedImages.length,
    thumbnailUrl: uploadedImages[0]?.dataUrl,
  };

  const toggleImageSelection = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const selectAll = () => {
    setSelectedImages(new Set(uploadedImages.map(img => img.id)));
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  const downloadSelected = async () => {
    if (selectedImages.size === 0) {
      alert('Please select images to download');
      return;
    }

    try {
      const zip = new JSZip();
      const folder = zip.folder(`staging-collection-${Date.now()}`);

      if (!folder) {
        throw new Error('Failed to create ZIP folder');
      }

      // Add selected images to ZIP
      for (const imageId of selectedImages) {
        const image = uploadedImages.find(img => img.id === imageId);
        const results = stagingResults[imageId] || [];

        if (!image) continue;

        // Add original image
        const originalBlob = await fetch(image.dataUrl).then(r => r.blob());
        folder.file(`original-${image.name}`, originalBlob);

        // Add all staged versions if they exist
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result?.stagedImageUrl) {
            const stagedBlob = await fetch(result.stagedImageUrl).then(r => r.blob());
            const filename = results.length > 1
              ? `staged-${image.name.replace(/\.[^/.]+$/, '')}-v${i + 1}${image.name.match(/\.[^/.]+$/)?.[0] || '.jpg'}`
              : `staged-${image.name}`;
            folder.file(filename, stagedBlob);
          }
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `staging-collection-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      alert(`✅ Downloaded ${selectedImages.size} image pairs`);
    } catch (error) {
      console.error('Download error:', error);
      alert('❌ Failed to download collection');
    }
  };

  const downloadAll = async () => {
    selectAll();
    setTimeout(downloadSelected, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-3 rounded-xl">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
                <p className="text-gray-600">Organize and download your staged images</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current Collection Info */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                  {currentCollection.thumbnailUrl ? (
                    <img
                      src={currentCollection.thumbnailUrl}
                      alt="Collection thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentCollection.name}
                  </h3>
                  <p className="text-gray-600">
                    {currentCollection.imageCount} images •{' '}
                    {Object.values(stagingResults).flat().length} staged versions
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {currentCollection.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={selectedImages.size > 0 ? deselectAll : selectAll}
                >
                  {selectedImages.size > 0 ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={downloadSelected}
                  disabled={selectedImages.size === 0}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Selected ({selectedImages.size})
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Images Grid/List */}
        {uploadedImages.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Images in Collection
            </h3>
            <p className="text-gray-600">
              Upload and stage some images to create a collection
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {uploadedImages.map((image) => {
              const results = stagingResults[image.id] || [];
              const latestResult = results[results.length - 1];
              const isSelected = selectedImages.has(image.id);
              const analysis = roomAnalyses[image.id];

              return (
                <div
                  key={image.id}
                  className={`
                    bg-white rounded-xl border-2 overflow-hidden transition-all
                    ${
                      isSelected
                        ? 'border-purple-600 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300'
                    }
                  `}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <div>
                      <div className="grid grid-cols-2 gap-1 p-1">
                        {/* Original */}
                        <div className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const viewerImgs = [
                              { src: image.dataUrl, alt: `${analysis?.roomType || 'Room'} - Original`, filename: `original-${image.name}` },
                              ...results.map((r, idx) => ({
                                src: r.stagedImageUrl || image.dataUrl,
                                alt: `${analysis?.roomType || 'Room'} - Staged v${idx + 1}`,
                                filename: `staged-${image.name.replace(/\.[^/.]+$/, '')}-v${idx + 1}${image.name.match(/\.[^/.]+$/)?.[0] || '.jpg'}`
                              }))
                            ];
                            setViewerImages(viewerImgs);
                            setViewerIndex(0);
                            setPhotoViewerOpen(true);
                          }}
                        >
                          <img
                            src={image.dataUrl}
                            alt={`Original ${image.name}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded font-medium shadow-lg">
                            Original
                          </div>
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                              <Maximize2 className="w-5 h-5 text-purple-600" />
                            </div>
                          </div>
                        </div>

                        {/* Staged */}
                        <div className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (results.length > 0) {
                              const viewerImgs = [
                                { src: image.dataUrl, alt: `${analysis?.roomType || 'Room'} - Original`, filename: `original-${image.name}` },
                                ...results.map((r, idx) => ({
                                  src: r.stagedImageUrl || image.dataUrl,
                                  alt: `${analysis?.roomType || 'Room'} - Staged v${idx + 1}`,
                                  filename: `staged-${image.name.replace(/\.[^/.]+$/, '')}-v${idx + 1}${image.name.match(/\.[^/.]+$/)?.[0] || '.jpg'}`
                                }))
                              ];
                              setViewerImages(viewerImgs);
                              setViewerIndex(1);
                              setPhotoViewerOpen(true);
                            }
                          }}
                        >
                          {latestResult?.stagedImageUrl ? (
                            <>
                              <img
                                src={latestResult.stagedImageUrl}
                                alt={`Staged ${image.name}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-purple-600 bg-opacity-90 text-white text-xs px-2 py-1 rounded font-medium shadow-lg">
                                Staged {results.length > 1 && `(${results.length})`}
                              </div>
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                                  <Maximize2 className="w-5 h-5 text-purple-600" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <p className="text-sm text-gray-500">Not staged yet</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 cursor-pointer" onClick={() => toggleImageSelection(image.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {image.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {analysis?.roomType || 'Room'} • {latestResult ? `Staged${results.length > 1 ? ` (${results.length})` : ''}` : 'Original only'}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="ml-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // List View
                    <div className="flex items-center p-4 space-x-4 cursor-pointer" onClick={() => toggleImageSelection(image.id)}>
                      {/* Thumbnails */}
                      <div className="flex space-x-2">
                        <div className="relative group w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const viewerImgs = [
                              { src: image.dataUrl, alt: `${analysis?.roomType || 'Room'} - Original`, filename: `original-${image.name}` },
                              ...results.map((r, idx) => ({
                                src: r.stagedImageUrl || image.dataUrl,
                                alt: `${analysis?.roomType || 'Room'} - Staged v${idx + 1}`,
                                filename: `staged-${image.name.replace(/\.[^/.]+$/, '')}-v${idx + 1}${image.name.match(/\.[^/.]+$/)?.[0] || '.jpg'}`
                              }))
                            ];
                            setViewerImages(viewerImgs);
                            setViewerIndex(0);
                            setPhotoViewerOpen(true);
                          }}
                        >
                          <img
                            src={image.dataUrl}
                            alt="Original"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black bg-opacity-40 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        {latestResult?.stagedImageUrl && (
                          <div className="relative group w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const viewerImgs = [
                                { src: image.dataUrl, alt: `${analysis?.roomType || 'Room'} - Original`, filename: `original-${image.name}` },
                                ...results.map((r, idx) => ({
                                  src: r.stagedImageUrl || image.dataUrl,
                                  alt: `${analysis?.roomType || 'Room'} - Staged v${idx + 1}`,
                                  filename: `staged-${image.name.replace(/\.[^/.]+$/, '')}-v${idx + 1}${image.name.match(/\.[^/.]+$/)?.[0] || '.jpg'}`
                                }))
                              ];
                              setViewerImages(viewerImgs);
                              setViewerIndex(1);
                              setPhotoViewerOpen(true);
                            }}
                          >
                            <img
                              src={latestResult.stagedImageUrl}
                              alt="Staged"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black bg-opacity-40 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{image.name}</h4>
                        <p className="text-sm text-gray-600">
                          {analysis?.roomType || 'Room'} • {latestResult ? `Original + Staged${results.length > 1 ? ` (${results.length})` : ''}` : 'Original only'}
                        </p>
                      </div>

                      {/* Checkbox */}
                      {isSelected && (
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Action Bar */}
        {uploadedImages.length > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-2xl border-2 border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-700">
                {selectedImages.size} of {uploadedImages.length} selected
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <Button
                variant="outline"
                size="sm"
                onClick={selectedImages.size > 0 ? deselectAll : selectAll}
              >
                {selectedImages.size > 0 ? 'Clear' : 'Select All'}
              </Button>
              <Button
                size="sm"
                onClick={downloadSelected}
                disabled={selectedImages.size === 0}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download ZIP
              </Button>
            </div>
          </div>
        )}
      </div>

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
