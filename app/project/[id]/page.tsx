'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ArrowLeft, Download, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoViewer } from '@/components/ui/photo-viewer';
import { MAX_VERSIONS_PER_IMAGE } from '@/types';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const {
    currentProperty,
    uploadedImages,
    stagingResults,
    loadProject,
    deleteProject,
    setStep,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<Array<{ src: string; alt: string; filename?: string }>>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await loadProject(projectId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, loadProject]);

  const handleContinueEditing = (imageId: string) => {
    setStep('results');
    router.push('/');
  };
  const openPhotoViewer = (images: Array<{ src: string; alt: string; filename?: string }>, startIndex: number) => {
    setViewerImages(images);
    setViewerIndex(startIndex);
    setPhotoViewerOpen(true);
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      const success = await deleteProject(projectId);
      if (success) {
        router.push('/projects');
      } else {
        setError('Failed to delete project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDownloadVersion = async (imageUrl: string, imageName: string, versionNum: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${imageName}-v${versionNum}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <Link href="/projects" className="text-red-600 hover:underline mt-4 inline-block">
              ← Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/projects" className="inline-flex items-center text-gray-900 hover:text-black font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Project
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {currentProperty?.name !== 'Untitled Project'
              ? currentProperty?.name
              : (currentProperty?.address || 'Property Details')}
          </h1>
          {currentProperty?.name !== 'Untitled Project' && currentProperty?.address && (
            <p className="text-gray-900 text-lg">{currentProperty.address}</p>
          )}
        </div>

        <div className="space-y-8">
          {uploadedImages.map((image) => {
            const versions = stagingResults[image.id] || [];
            const canEdit = versions.length < MAX_VERSIONS_PER_IMAGE;
            const allImages = [
              { src: image.dataUrl, alt: 'Original', filename: image.name },
              ...versions.map((v, idx) => ({
                src: v.stagedImageUrl!,
                alt: `Version ${idx + 1}`,
                filename: `${image.name}-version-${idx + 1}`
              }))
            ];

            return (
              <div key={image.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{image.name}</h3>
                    <p className="text-sm text-gray-900 mt-1 font-medium">
                      {versions.length} version{versions.length !== 1 ? 's' : ''}
                      {!canEdit && <span className="ml-2 text-amber-600 font-semibold">(Maximum {MAX_VERSIONS_PER_IMAGE} versions reached)</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Original Image */}
                    <div className="cursor-pointer" onClick={() => openPhotoViewer(allImages, 0)}>
                      <img
                        src={image.dataUrl}
                        alt="Original"
                        className="w-full aspect-video object-cover rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all hover:opacity-80"
                      />
                      <p className="text-center mt-2 text-sm font-semibold text-gray-900">Original</p>
                    </div>

                    {/* Staged Versions */}
                    {versions.map((version, idx) => (
                      <div key={idx} className="cursor-pointer" onClick={() => openPhotoViewer(allImages, idx + 1)}>
                        <img
                          src={version.stagedImageUrl}
                          alt={`Version ${idx + 1}`}
                          className="w-full aspect-video object-cover rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all hover:opacity-80"
                        />
                        <p className="text-center mt-2 text-sm font-semibold text-gray-900">Version {idx + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  {canEdit ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-gray-900 mb-2">
                        <span className="font-semibold">Edit Credits Available:</span>
                        <span className="font-bold text-purple-600">
                          {MAX_VERSIONS_PER_IMAGE - versions.length} / {MAX_VERSIONS_PER_IMAGE - 1} remaining
                        </span>
                      </div>
                      <Button onClick={() => handleContinueEditing(image.id)} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                        <Edit className="w-4 h-4 mr-2" />
                        {versions.length === 0 ? 'Start Editing' : 'Continue Editing'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-amber-600 font-bold">
                        Maximum {MAX_VERSIONS_PER_IMAGE} versions reached
                      </p>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        No more edits available for this image
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Project?</h2>
            <p className="text-gray-900 mb-6">
              Are you sure you want to delete &quot;{currentProperty?.name || 'this project'}&quot;? This action cannot be undone and will delete all images and versions.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteProject}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <PhotoViewer
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        images={viewerImages}
        initialIndex={viewerIndex}
      />
    </>
  );
}
