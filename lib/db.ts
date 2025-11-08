import { supabase, STORAGE_BUCKETS, isSupabaseConfigured } from './supabase';
import type {
  UploadedImage,
  RoomAnalysis,
  RoomGroup,
  RoomStagingConfig,
  StagingResult,
  AppState,
} from '@/types';

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

export async function createProject(name?: string) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: name || 'Untitled Project',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }

  return data;
}

export async function updateProject(projectId: string, updates: Partial<AppState>) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('projects')
    .update({
      current_step: updates.currentStep,
      selected_mode: updates.selectedMode,
      selected_preset: updates.selectedPreset,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    return null;
  }

  return data;
}

export async function getProject(projectId: string) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error getting project:', error);
    return null;
  }

  return data;
}

// ============================================================================
// IMAGE MANAGEMENT
// ============================================================================

export async function uploadImageToStorage(
  projectId: string,
  imageId: string,
  file: File | Blob,
  filename: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  console.log('uploadImageToStorage called with:');
  console.log('- File/Blob:', file);
  console.log('- File size:', file.size, 'bytes');
  console.log('- File type:', file.type);
  console.log('- Is File?', file instanceof File);
  console.log('- Is Blob?', file instanceof Blob);

  const fileExt = filename.split('.').pop();
  const filePath = `${projectId}/${imageId}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.ORIGINAL_IMAGES)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.ORIGINAL_IMAGES)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function saveImage(projectId: string, image: UploadedImage, imageUrl: string) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('images')
    .insert({
      id: image.id,
      project_id: projectId,
      name: image.name,
      original_url: imageUrl,
      uploaded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving image:', error);
    return null;
  }

  return data;
}

export async function getProjectImages(projectId: string) {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: true });

  if (error) {
    console.error('Error getting images:', error);
    return [];
  }

  return data;
}

export async function deleteImage(imageId: string) {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId);

  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }

  return true;
}

// ============================================================================
// ROOM ANALYSIS
// ============================================================================

export async function saveRoomAnalysis(imageId: string, analysis: RoomAnalysis) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('room_analyses')
    .upsert({
      image_id: imageId,
      room_type: analysis.roomType,
      dimensions: analysis.dimensions || {},
      features: analysis.features || [],
      lighting: analysis.lighting,
      flooring: analysis.flooring,
      windows: analysis.windows,
      detailed_lighting: analysis.detailedLighting || {},
      wall_info: analysis.wallInfo || {},
      connections: analysis.connections || {},
      signature_features: analysis.signatureFeatures || [],
      spatial_notes: analysis.spatialNotes,
      spatial_fingerprint: analysis.spatialFingerprint,
      analyzed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving room analysis:', error);
    return null;
  }

  return data;
}

export async function getRoomAnalyses(projectId: string) {
  if (!isSupabaseConfigured()) return {};

  const { data: images } = await supabase
    .from('images')
    .select('id')
    .eq('project_id', projectId);

  if (!images) return {};

  const imageIds = images.map((img) => img.id);

  const { data, error } = await supabase
    .from('room_analyses')
    .select('*')
    .in('image_id', imageIds);

  if (error) {
    console.error('Error getting room analyses:', error);
    return {};
  }

  // Convert array to Record<string, RoomAnalysis>
  const analyses: Record<string, RoomAnalysis> = {};
  data.forEach((analysis) => {
    analyses[analysis.image_id] = {
      imageId: analysis.image_id,
      roomType: analysis.room_type,
      dimensions: analysis.dimensions,
      features: analysis.features,
      lighting: analysis.lighting,
      flooring: analysis.flooring,
      windows: analysis.windows,
      detailedLighting: analysis.detailed_lighting,
      wallInfo: analysis.wall_info,
      connections: analysis.connections,
      signatureFeatures: analysis.signature_features,
      spatialNotes: analysis.spatial_notes,
      spatialFingerprint: analysis.spatial_fingerprint,
    };
  });

  return analyses;
}

// ============================================================================
// ROOM CONFIGURATIONS
// ============================================================================

export async function saveRoomConfig(projectId: string, roomId: string, config: RoomStagingConfig) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('room_configs')
    .upsert({
      project_id: projectId,
      room_id: roomId,
      mode: config.mode,
      preset: config.preset,
      settings: config.settings,
      seed: config.seed,
      use_layered_generation: config.useLayeredGeneration,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving room config:', error);
    return null;
  }

  return data;
}

export async function getRoomConfigs(projectId: string) {
  if (!isSupabaseConfigured()) return {};

  const { data, error } = await supabase
    .from('room_configs')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error getting room configs:', error);
    return {};
  }

  // Convert to Record<string, RoomStagingConfig>
  const configs: Record<string, RoomStagingConfig> = {};
  data.forEach((config) => {
    configs[config.room_id] = {
      roomId: config.room_id,
      mode: config.mode,
      preset: config.preset,
      settings: config.settings,
      seed: config.seed,
      useLayeredGeneration: config.use_layered_generation,
    };
  });

  return configs;
}

// ============================================================================
// STAGING RESULTS
// ============================================================================

export async function uploadStagedImage(
  projectId: string,
  imageId: string,
  imageBlob: Blob,
  editNumber: number = 0
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const filename = editNumber === 0 ? 'final.png' : `edit-${editNumber}.png`;
  const filePath = `${projectId}/${imageId}/${filename}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.STAGED_IMAGES)
    .upload(filePath, imageBlob, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading staged image:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.STAGED_IMAGES)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function saveStagingResult(imageId: string, result: StagingResult) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('staging_results')
    .upsert({
      image_id: imageId,
      room_type: result.roomType,
      description: result.description,
      suggestions: result.suggestions,
      staged_image_url: result.stagedImageUrl,
      details: result.details,
      layers: result.layers,
      is_layered: result.isLayered,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving staging result:', error);
    return null;
  }

  return data;
}

export async function getStagingResults(projectId: string) {
  if (!isSupabaseConfigured()) return {};

  const { data: images } = await supabase
    .from('images')
    .select('id')
    .eq('project_id', projectId);

  if (!images) return {};

  const imageIds = images.map((img) => img.id);

  const { data, error } = await supabase
    .from('staging_results')
    .select('*')
    .in('image_id', imageIds);

  if (error) {
    console.error('Error getting staging results:', error);
    return {};
  }

  // Convert to Record<string, StagingResult>
  const results: Record<string, StagingResult> = {};
  data.forEach((result) => {
    results[result.image_id] = {
      imageId: result.image_id,
      roomType: result.room_type,
      description: result.description,
      suggestions: result.suggestions,
      stagedImageUrl: result.staged_image_url,
      details: result.details,
      layers: result.layers,
      isLayered: result.is_layered,
    };
  });

  return results;
}

// ============================================================================
// EDIT HISTORY
// ============================================================================

export async function saveEditHistory(
  stagingResultId: string,
  editInstruction: string,
  editedImageUrl: string,
  editNumber: number
) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('edit_history')
    .insert({
      staging_result_id: stagingResultId,
      edit_instruction: editInstruction,
      edited_image_url: editedImageUrl,
      edit_number: editNumber,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving edit history:', error);
    return null;
  }

  return data;
}

export async function getEditHistory(stagingResultId: string) {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('edit_history')
    .select('*')
    .eq('staging_result_id', stagingResultId)
    .order('edit_number', { ascending: true });

  if (error) {
    console.error('Error getting edit history:', error);
    return [];
  }

  return data;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function deleteProject(projectId: string) {
  if (!isSupabaseConfigured()) return false;

  // Delete project (will cascade delete all related data)
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }

  // Delete all storage files for this project
  const { data: originalFiles } = await supabase.storage
    .from(STORAGE_BUCKETS.ORIGINAL_IMAGES)
    .list(projectId);

  if (originalFiles) {
    const filesToDelete = originalFiles.map((file) => `${projectId}/${file.name}`);
    await supabase.storage
      .from(STORAGE_BUCKETS.ORIGINAL_IMAGES)
      .remove(filesToDelete);
  }

  const { data: stagedFiles } = await supabase.storage
    .from(STORAGE_BUCKETS.STAGED_IMAGES)
    .list(projectId);

  if (stagedFiles) {
    const filesToDelete = stagedFiles.map((file) => `${projectId}/${file.name}`);
    await supabase.storage
      .from(STORAGE_BUCKETS.STAGED_IMAGES)
      .remove(filesToDelete);
  }

  return true;
}

// Convert data URL to Blob for uploading
export function dataURLtoBlob(dataURL: string): Blob {
  console.log('dataURLtoBlob called');
  console.log('- dataURL length:', dataURL.length);
  console.log('- dataURL prefix:', dataURL.substring(0, 50));

  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)![1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  const blob = new Blob([u8arr], { type: mime });
  console.log('- Created blob size:', blob.size, 'bytes');
  console.log('- Blob type:', blob.type);

  return blob;
}
