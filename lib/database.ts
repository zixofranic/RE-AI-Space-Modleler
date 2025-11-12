import { supabase, isSupabaseConfigured } from './supabase';
import type { RoomAnalysis, StagingResult, UploadedImage, DesignSettings } from '@/types';

// =============================================
// PROJECT OPERATIONS
// =============================================

export async function saveProject(projectId: string, data: {
  name?: string;
  address?: string;
  settings?: Partial<DesignSettings>;
  metadata?: Record<string, any>;
}) {
  try {
    const { data: result, error } = await supabase
      .from('projects')
      .upsert({
        id: projectId,
        name: data.name || `Project ${projectId.slice(0, 8)}`,
        address: data.address,
        settings: data.settings || {},
        metadata: data.metadata || {},
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving project:', error);
    return { success: false, error: String(error) };
  }
}

export async function getAllProjects(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return { success: false, error: String(error) };
  }
}

// =============================================
// IMAGE OPERATIONS
// =============================================

export async function saveImage(imageData: {
  id: string;
  projectId: string;
  originalUrl: string;
  thumbnailUrl?: string;
  analysis?: RoomAnalysis;
  metadata?: Record<string, any>;
}) {
  try {
    const { data: result, error } = await supabase
      .from('images')
      .upsert({
        id: imageData.id,
        project_id: imageData.projectId,
        original_url: imageData.originalUrl,
        thumbnail_url: imageData.thumbnailUrl,
        analysis: imageData.analysis || {},
        metadata: imageData.metadata || {},
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving image:', error);
    return { success: false, error: String(error) };
  }
}

export async function getProjectImages(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching images:', error);
    return { success: false, error: String(error) };
  }
}

// =============================================
// STAGING RESULT OPERATIONS
// =============================================

export async function saveStagingResult(resultData: {
  id: string;
  imageId: string;
  projectId: string;
  stagedUrl: string;
  stagedThumbnailUrl?: string;
  config?: any;
  description?: string;
  suggestions?: string;
  details?: any;
  metadata?: Record<string, any>;
}) {
  try {
    const { data: result, error } = await supabase
      .from('staging_results')
      .upsert({
        id: resultData.id,
        image_id: resultData.imageId,
        project_id: resultData.projectId,
        staged_url: resultData.stagedUrl,
        staged_thumbnail_url: resultData.stagedThumbnailUrl,
        config: resultData.config || {},
        description: resultData.description || '',
        suggestions: resultData.suggestions || '',
        details: resultData.details || {},
        metadata: resultData.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving staging result:', error);
    return { success: false, error: String(error) };
  }
}

export async function getImageStagingResults(imageId: string) {
  try {
    const { data, error } = await supabase
      .from('staging_results')
      .select('*')
      .eq('image_id', imageId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching staging results:', error);
    return { success: false, error: String(error) };
  }
}

export async function getProjectStagingResults(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('staging_results')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching project staging results:', error);
    return { success: false, error: String(error) };
  }
}

// =============================================
// COMPLETE PROJECT DATA
// =============================================

export async function getCompleteProject(projectId: string) {
  try {
    // Fetch project, images, and staging results in parallel
    const [projectResult, imagesResult, stagingResult] = await Promise.all([
      getProject(projectId),
      getProjectImages(projectId),
      getProjectStagingResults(projectId),
    ]);

    if (!projectResult.success) {
      return { success: false, error: 'Project not found' };
    }

    return {
      success: true,
      data: {
        project: projectResult.data,
        images: imagesResult.data || [],
        stagingResults: stagingResult.data || [],
      },
    };
  } catch (error) {
    console.error('Error fetching complete project:', error);
    return { success: false, error: String(error) };
  }
}

// =============================================
// PROJECT WITH THUMBNAILS (for "My Projects" page)
// =============================================

export async function getProjectsWithThumbnails(limit = 50) {
  try {
    // Step 1: Fetch projects ONLY (no images) - super fast
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, address, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (projectsError) throw projectsError;
    if (!projects || projects.length === 0) {
      return { success: true, data: [] };
    }

    // Step 2: Fetch ONLY first image per project (much faster)
    const projectIds = projects.map(p => p.id);

    // Get all images but we'll filter to first per project
    const { data: allImages, error: imagesError } = await supabase
      .from('images')
      .select('id, project_id, thumbnail_url, original_url, uploaded_at')
      .in('project_id', projectIds)
      .order('uploaded_at', { ascending: true });

    if (imagesError) throw imagesError;

    // Create a map of projectId -> first image + total count
    const projectImageMap = new Map();
    allImages?.forEach(img => {
      if (!projectImageMap.has(img.project_id)) {
        // First image for this project - keep it
        projectImageMap.set(img.project_id, {
          firstImage: img,
          count: 1
        });
      } else {
        // Additional image - just increment count
        projectImageMap.get(img.project_id).count++;
      }
    });

    // Step 3: Combine projects with their first image
    const projectsWithThumbnails = projects.map(project => {
      const imageData = projectImageMap.get(project.id);
      return {
        ...project,
        images: imageData ? [imageData.firstImage] : [],
        _imageCount: imageData ? imageData.count : 0,
      };
    });

    return { success: true, data: projectsWithThumbnails };
  } catch (error) {
    console.error('Error fetching projects with thumbnails:', error);
    return { success: false, error: String(error) };
  }
}

export async function getProject(projectId: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error getting project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project',
    };
  }
}

export async function getStagingResultsForImage(imageId: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('staging_results')
      .select('*')
      .eq('image_id', imageId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Convert database format to StagingResult format
    const results = data?.map((row: any) => ({
      imageId: row.image_id,
      roomType: row.room_type || 'Room',
      description: row.description || '',
      suggestions: row.suggestions || '',
      stagedImageUrl: row.staged_url,
      details: row.details || {},
      layers: row.layers,
      isLayered: row.is_layered,
    })) || [];

    return { success: true, data: results };
  } catch (error) {
    console.error('Error getting staging results:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get results',
    };
  }
}
