'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/upload/ImageUploader';
import type { Collection } from '@/types';

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const collectionId = params.collectionId as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}`);
      if (!response.ok) throw new Error('Failed to load collection');

      const data = await response.json();
      setCollection(data.collection);
      setImages(data.images || []);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium">Loading collection...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/project/${projectId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {collection?.name || 'Collection'}
                </h1>
                <p className="text-gray-600">
                  {images.length} {images.length === 1 ? 'image' : 'images'}
                </p>
              </div>

              <Button
                onClick={() => setShowUploader(!showUploader)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Photos
              </Button>
            </div>
          </div>
        </div>

        {/* Image Uploader */}
        {showUploader && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Photos
            </h2>
            <ImageUploader />
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUploader(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowUploader(false);
                  // TODO: Process uploaded images for this collection
                  alert('Upload flow will be integrated here');
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Continue to Staging
              </Button>
            </div>
          </div>
        )}

        {/* Images Grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <img
                  src={image.original_url}
                  alt={`Image ${image.id}`}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    Uploaded {new Date(image.uploaded_at).toLocaleDateString()}
                  </p>
                  {image.staging_results?.length > 0 && (
                    <p className="text-xs text-purple-600 mt-2">
                      {image.staging_results.length} staged {image.staging_results.length === 1 ? 'version' : 'versions'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No photos yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload photos of this space to get started with AI staging
            </p>
            <Button
              onClick={() => setShowUploader(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload First Photo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
