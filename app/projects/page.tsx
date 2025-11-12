'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProjectsWithThumbnails } from '@/lib/database';
import { UserMenu } from '@/components/auth/UserMenu';
import { FolderOpen, Calendar, Image as ImageIcon, ArrowLeft, ExternalLink, Edit } from 'lucide-react';

interface ProjectWithImages {
  id: string;
  name: string;
  address?: string;
  created_at: string;
  updated_at: string;
  images: Array<{
    id: string;
    original_url: string;
    thumbnail_url?: string;
    uploaded_at: string;
  }>;
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError(undefined);

    // Reduced limit from 50 to 20 for faster initial load
    const result = await getProjectsWithThumbnails(20);

    if (result.success && result.data) {
      setProjects(result.data as ProjectWithImages[]);
    } else {
      setError(result.error || 'Failed to load projects');
    }

    setLoading(false);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-900 hover:text-black mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Projects</h1>
              <p className="text-gray-900 font-medium">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadProjects}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !projects.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-gray-200" />
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No projects yet
            </h2>
            <p className="text-gray-900 mb-6">
              Upload some images to create your first project
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create New Project
            </Link>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const firstImage = project.images?.[0];
              const imageCount = (project as any)._imageCount || project.images?.length || 0;

              return (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {firstImage ? (
                      <img
                        src={firstImage.thumbnail_url || firstImage.original_url}
                        alt={project.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-300" />
                      </div>
                    )}

                    {/* Image count badge */}
                    {imageCount > 0 && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        {imageCount}
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="bg-purple-600 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
                      {project.name !== 'Untitled Project' ? project.name : (project.address || project.name)}
                    </h3>

                    {project.name !== 'Untitled Project' && project.address && (
                      <p className="text-sm text-gray-900 mb-2 truncate">
                        {project.address}
                      </p>
                    )}

                    <div className="flex items-center text-sm text-gray-900 mb-3">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(project.updated_at)}
                    </div>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-gray-900 font-medium">
                        {imageCount} {imageCount === 1 ? 'image' : 'images'}
                      </span>
                      <span className="text-blue-600 font-medium group-hover:underline">
                        View Details →
                      </span>
                    </div>

                    {/* Edit Button */}
                    <Link
                      href={`/project/${project.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Project
                    </Link>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
