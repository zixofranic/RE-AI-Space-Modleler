'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ArrowLeft, Download, Edit } from 'lucide-react';
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
    setStep,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

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
  const openPhotoViewer = (images: string[], startIndex: number) => {
    setViewerImages(images);
    setViewerIndex(startIndex);
    setPhotoViewerOpen(true);
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
            <p className="text-gray-600">Loading project...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/projects" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {currentProperty?.name || 'Property Details'}
          </h1>
          {currentProperty?.address && (
            <p className="text-gray-600 text-lg">{currentProperty.address}</p>
          )}
        </div>

        <div className="space-y-8">
          {uploadedImages.map((image) => {
            const versions = stagingResults[image.id] || [];
            const canEdit = versions.length < MAX_VERSIONS_PER_IMAGE;
            const allImages = [image.dataUrl, ...versions.map(v => v.stagedImageUrl!)];

            return (
              <div key={image.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <img src={image.dataUrl} alt="Original" className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openPhotoViewer(allImages, 0)} />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Original Image</h3>
                      <p className="text-sm text-gray-600">{image.name}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {versions.length} version{versions.length !== 1 ? 's' : ''}
                        {!canEdit && <span className="ml-2 text-amber-600">(Maximum {MAX_VERSIONS_PER_IMAGE} versions reached)</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {versions.length > 0 && (
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Staged Versions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {versions.map((version, idx) => (
                        <div key={idx} className="group relative">
                          <img src={version.stagedImageUrl} alt={`Version ${idx + 1}`} className="w-full aspect-video object-cover rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-colors" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button size="sm" variant="outline" onClick={() => handleDownloadVersion(version.stagedImageUrl!, image.name, idx + 1)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-center mt-2 text-sm font-medium text-gray-700">Version {idx + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <Button onClick={() => handleContinueEditing(image.id)} disabled={!canEdit} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400" size="lg">
                    <Edit className="w-4 h-4 mr-2" />
                    {canEdit ? `Continue Editing (${MAX_VERSIONS_PER_IMAGE - versions.length} edit${MAX_VERSIONS_PER_IMAGE - versions.length !== 1 ? 's' : ''} remaining)` : `Maximum ${MAX_VERSIONS_PER_IMAGE} Versions Reached`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
      <PhotoViewer
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        images={viewerImages}
        initialIndex={viewerIndex}
      />
  );
}
