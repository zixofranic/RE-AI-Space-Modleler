'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Folder, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Collection } from '@/types';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjectAndCollections();
  }, [projectId]);

  const loadProjectAndCollections = async () => {
    setLoading(true);
    try {
      // Load project details
      const projectRes = await fetch(`/api/projects/${projectId}`);
      if (!projectRes.ok) throw new Error('Failed to load project');
      const projectData = await projectRes.json();
      setProject(projectData.project);

      // Load collections for this project
      const collectionsRes = await fetch(`/api/collections?project_id=${projectId}`);
      if (!collectionsRes.ok) throw new Error('Failed to load collections');
      const collectionsData = await collectionsRes.json();
      setCollections(collectionsData.collections || []);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: newCollectionName.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create collection');

      const { collection } = await response.json();

      // Reload collections
      await loadProjectAndCollections();

      // Reset and close modal
      setNewCollectionName('');
      setShowNewCollectionModal(false);

      // Navigate to the new collection
      router.push(`/project/${projectId}/collection/${collection.id}`);
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection');
    } finally {
      setCreating(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/projects">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project?.name || 'Project'}
                </h1>
                {project?.address && (
                  <p className="text-gray-600">{project.address}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Collection Card */}
          <button
            onClick={() => setShowNewCollectionModal(true)}
            className="bg-white rounded-2xl shadow-lg p-8 border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
              <div className="w-16 h-16 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center mb-4 transition-colors">
                <Plus className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-900">
                New Collection
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Add a new room or space
              </p>
            </div>
          </button>

          {/* Existing Collections */}
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/project/${projectId}/collection/${collection.id}`}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500 group"
            >
              <div className="flex flex-col h-full min-h-[200px]">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                    <Folder className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ImageIcon className="w-4 h-4" />
                    <span>{collection.imageCount || 0}</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-900 mb-2">
                  {collection.name}
                </h3>

                {collection.room_type && (
                  <p className="text-sm text-gray-600 mb-4">{collection.room_type}</p>
                )}

                <div className="mt-auto">
                  <p className="text-xs text-gray-500">
                    Created {new Date(collection.created_at!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {collections.length === 0 && (
          <div className="text-center py-16">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No collections yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first collection to organize photos by room or space
            </p>
            <Button
              onClick={() => setShowNewCollectionModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Collection
            </Button>
          </div>
        )}
      </div>

      {/* New Collection Modal */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Collection
            </h2>
            <p className="text-gray-600 mb-6">
              Name this collection (e.g., "Living Room", "Master Bedroom")
            </p>

            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
              placeholder="Collection name..."
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 mb-6"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCollectionModal(false);
                  setNewCollectionName('');
                }}
                className="flex-1"
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || creating}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {creating ? 'Creating...' : 'Create Collection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
