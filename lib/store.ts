import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppState,
  UploadedImage,
  RoomAnalysis,
  RoomGroup,
  RoomStagingConfig,
  StagingResult,
  DesignMode,
  Property,
  ProjectStyleGuide,
} from '@/types';
import { MAX_VERSIONS_PER_IMAGE } from '@/types';
import {
  uploadImageToStorage,
  uploadStagedImage,
  dataURLtoBlob,
  deleteProject as deleteProjectFromDB,
} from './db';
import { supabase, isSupabaseConfigured } from './supabase';

interface AppActions {
  // Property management
  setCurrentProperty: (property: { id: string; name: string; address?: string; isNew: boolean } | null) => void;
  loadAvailableProperties: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<boolean>;
  clearProject: () => void;

  // Style Guide ("Seed & Lock" for consistency)
  setProjectStyleGuide: (styleGuide: ProjectStyleGuide) => void;

  // Image management
  addImages: (images: UploadedImage[]) => void;
  removeImage: (imageId: string) => void;
  setRoomAnalysis: (imageId: string, analysis: RoomAnalysis) => void;
  setRoomGroups: (groups: RoomGroup[]) => void;

  // Navigation
  setStep: (step: AppState['currentStep']) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Design configuration
  setMode: (mode: DesignMode) => void;
  setPreset: (presetId: string) => void;
  setRoomConfig: (roomId: string, config: Partial<RoomStagingConfig>) => void;
  updateRoomSettings: (roomId: string, settings: Partial<RoomStagingConfig['settings']>) => void;
  applySettingsToAllRooms: (settings: Partial<RoomStagingConfig['settings']>) => void;

  // Room selection
  selectRoom: (roomId: string) => void;

  // Experimental Features
  toggleSpatialConsistency: (enabled: boolean) => void;

  // Results
  setStagingResult: (imageId: string, result: StagingResult) => void;
  setStagingResults: (results: Record<string, StagingResult[]>) => void;

  // UI state
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | undefined) => void;

  // Reset
  reset: () => void;
}

const initialState: AppState = {
  currentProperty: null,
  availableProperties: [],
  currentStep: 'upload',
  uploadedImages: [],
  roomAnalyses: {},
  roomGroups: [],
  roomConfigs: {},
  stagingResults: {},
  enableSpatialConsistency: false, // Experimental feature toggle
  isProcessing: false,
  projectId: undefined, // Will be auto-generated on first use
};

const STEP_ORDER: AppState['currentStep'][] = ['upload', 'mode', 'customize', 'generate', 'results'];

// Simplified storage - only saves lightweight navigation state
// All large data (images, results) lives in Supabase
const customStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    return JSON.parse(str);
  },
  setItem: (name: string, value: any) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      // If quota exceeded, just clear and continue
      // All important data is in Supabase anyway
      console.warn('localStorage quota exceeded. Clearing cache. Data is safe in database.');
      localStorage.removeItem(name);
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const useStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
  ...initialState,

  // Image management
  addImages: async (images) => {
    const state = get();

    // Generate project ID if not exists
    let projectId = state.projectId;
    if (!projectId && isSupabaseConfigured()) {
      projectId = `project-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      set({ projectId });
    }

    // Upload images to Supabase if configured
    const processedImages = await Promise.all(
      images.map(async (img) => {
        if (isSupabaseConfigured() && projectId && img.file) {
          try {
            console.log(`📤 Uploading image ${img.name} to Supabase...`);
            console.log('File object:', img.file);
            console.log('File size:', img.file.size, 'bytes');
            console.log('File type:', img.file.type);
            const supabaseUrl = await uploadImageToStorage(projectId, img.id, img.file, img.name);

            if (supabaseUrl) {
              console.log(`✅ Image uploaded to Supabase: ${supabaseUrl}`);
              // Replace dataUrl with Supabase URL
              return {
                ...img,
                dataUrl: supabaseUrl,
              };
            } else {
              console.warn(`⚠️ Supabase upload failed for ${img.name}, keeping data URL`);
            }
          } catch (error) {
            console.error(`❌ Error uploading ${img.name}:`, error);
          }
        }
        // If Supabase not configured or upload failed, keep original dataUrl
        return img;
      })
    );

    set((state) => ({
      uploadedImages: [...state.uploadedImages, ...processedImages],
    }));
  },

  removeImage: (imageId) =>
    set((state) => ({
      uploadedImages: state.uploadedImages.filter((img) => img.id !== imageId),
      roomAnalyses: Object.fromEntries(
        Object.entries(state.roomAnalyses).filter(([id]) => id !== imageId)
      ),
    })),

  setRoomAnalysis: (imageId, analysis) =>
    set((state) => ({
      roomAnalyses: {
        ...state.roomAnalyses,
        [imageId]: analysis,
      },
    })),

  setRoomGroups: (groups) => set({ roomGroups: groups }),

  // Navigation
  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1);
      return { currentStep: STEP_ORDER[nextIndex] };
    }),

  previousStep: () =>
    set((state) => {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { currentStep: STEP_ORDER[prevIndex] };
    }),

  // Design configuration
  setMode: (mode) => set({ selectedMode: mode }),

  setPreset: (presetId) => set({ selectedPreset: presetId }),

  setRoomConfig: (roomId, config) =>
    set((state) => ({
      roomConfigs: {
        ...state.roomConfigs,
        [roomId]: {
          ...state.roomConfigs[roomId],
          ...config,
          roomId,
        } as RoomStagingConfig,
      },
    })),

  updateRoomSettings: (roomId, settings) =>
    set((state) => ({
      roomConfigs: {
        ...state.roomConfigs,
        [roomId]: {
          ...state.roomConfigs[roomId],
          roomId,
          settings: {
            ...state.roomConfigs[roomId]?.settings,
            ...settings,
          },
        } as RoomStagingConfig,
      },
    })),

  applySettingsToAllRooms: (settings) =>
    set((state) => {
      const updatedConfigs = { ...state.roomConfigs };

      // Get all room IDs (from images and groups)
      const roomIds = [
        ...state.uploadedImages.map((img) => img.id),
        ...state.roomGroups.map((group) => group.id),
      ];

      roomIds.forEach((roomId) => {
        updatedConfigs[roomId] = {
          ...updatedConfigs[roomId],
          roomId,
          settings: {
            ...updatedConfigs[roomId]?.settings,
            ...settings,
          },
        } as RoomStagingConfig;
      });

      return { roomConfigs: updatedConfigs };
    }),

  // Room selection
  selectRoom: (roomId) => set({ selectedRoomId: roomId }),

  // Experimental Features
  toggleSpatialConsistency: (enabled) => set({ enableSpatialConsistency: enabled }),

  // Results
  setStagingResult: async (imageId, result) => {
    const state = get();
    let processedResult = result;
    let supabaseUrl: string | null = null;

    // Upload staged image to Supabase if configured
    if (isSupabaseConfigured() && state.projectId && result.stagedImageUrl) {
      // Check if it's a data URL (base64)
      if (result.stagedImageUrl.startsWith('data:')) {
        try {
          console.log(`📤 Uploading staged image for ${imageId} to Supabase...`);

          // Convert data URL to Blob
          const blob = dataURLtoBlob(result.stagedImageUrl);

          // Get existing results count for this image to use as version number
          const existingResults = state.stagingResults[imageId] || [];
          const versionNumber = existingResults.length;

          // Upload to Supabase (generates both full-size and thumbnail)
          const uploadResult = await uploadStagedImage(state.projectId, imageId, blob, versionNumber);
          supabaseUrl = uploadResult.fullUrl;

          if (supabaseUrl) {
            console.log(`✅ Staged image uploaded to Supabase: ${supabaseUrl}`);
            if (uploadResult.thumbnailUrl) {
              console.log(`✅ Thumbnail generated: ${uploadResult.thumbnailUrl}`);
            }
            // Replace data URL with Supabase URLs
            processedResult = {
              ...result,
              stagedImageUrl: supabaseUrl,
              stagedThumbnailUrl: uploadResult.thumbnailUrl || undefined,
            };
          } else {
            console.warn(`⚠️ Supabase upload failed for staged image ${imageId}`);
          }
        } catch (error) {
          console.error(`❌ Error uploading staged image ${imageId}:`, error);
        }
      } else {
        // Already a Supabase URL
        supabaseUrl = result.stagedImageUrl;
      }
    }

    // Save metadata to database if we have a Supabase URL
    if (isSupabaseConfigured() && state.projectId && supabaseUrl) {
      try {
        const existingResults = state.stagingResults[imageId] || [];
        const versionNumber = existingResults.length;
        const resultId = `${imageId}-v${versionNumber}`;

        const saveResponse = await fetch('/api/save-staging-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: resultId,
            imageId: imageId,
            projectId: state.projectId,
            stagedUrl: supabaseUrl,
            description: result.description || '',
            suggestions: result.suggestions || '',
            roomType: result.roomType || '',
            details: result.details || {},
            metadata: {
              savedAt: new Date().toISOString(),
              versionNumber,
            },
          }),
        });

        if (saveResponse.ok) {
          console.log(`✅ Staging result metadata saved to database: ${resultId}`);
        } else {
          console.warn('⚠️ Failed to save staging result metadata to database (non-fatal)');
        }
      } catch (dbError) {
        console.error('⚠️ Database save error (non-fatal):', dbError);
      }
    }

    // Append to array instead of replacing
    set((state) => {
      const existingResults = state.stagingResults[imageId] || [];
      return {
        stagingResults: {
          ...state.stagingResults,
          [imageId]: [...existingResults, processedResult],
        },
      };
    });
  },

  setStagingResults: (results) => set({ stagingResults: results }),

  // UI state
  setProcessing: (isProcessing) => set({ isProcessing }),

  setError: (error) => set({ error }),

  // Style Guide Management
  setProjectStyleGuide: (styleGuide) => set({ projectStyleGuide: styleGuide }),

  // Reset
  // Property Management
  setCurrentProperty: (property) => {
    set({ currentProperty: property });
    if (property) {
      set({ projectId: property.id });
    }
  },

  loadAvailableProperties: async () => {
    try {
      const { getProjectsWithThumbnails } = await import('./database');
      const result = await getProjectsWithThumbnails(50);
      if (result.success && result.data) {
        const properties = result.data.map((p: any) => ({
          id: p.id,
          name: p.name || 'Untitled Property',
          address: p.address,
          property_type: p.property_type,
          created_at: p.created_at,
          updated_at: p.updated_at,
          imageCount: p.images?.length || 0,
        }));
        set({ availableProperties: properties });
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  },

  loadProject: async (projectId: string) => {
    try {
      const { getProject, getStagingResultsForImage } = await import('./database');

      // Clear localStorage before loading from database to prevent quota issues
      // The project data is in the database, so we don't need old localStorage data
      try {
        localStorage.removeItem('ai-staging-storage');
      } catch (clearError) {
        console.warn('Could not clear localStorage:', clearError);
      }

      // Load project
      const projectResult = await getProject(projectId);
      if (!projectResult.success) throw new Error('Project not found');

      // Load images (may be empty for new projects)
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('project_id', projectId);

      const images = imagesData || [];

      // Load staging results for ALL images in ONE query (performance fix)
      const allStagingResults: Record<string, StagingResult[]> = {};
      const allAnalyses: Record<string, RoomAnalysis> = {};

      // Fetch all staging results for the project in a single query
      if (images.length > 0) {
        const { data: allResults, error: resultsError } = await supabase
          .from('staging_results')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (!resultsError && allResults) {
          // Group results by image_id
          allResults.forEach((row: any) => {
            if (!allStagingResults[row.image_id]) {
              allStagingResults[row.image_id] = [];
            }
            allStagingResults[row.image_id].push({
              imageId: row.image_id,
              roomType: row.room_type || 'Room',
              description: row.description || '',
              suggestions: row.suggestions || '',
              stagedImageUrl: row.staged_url,
              details: row.details || {},
              layers: row.layers,
              isLayered: row.is_layered,
            });
          });
        }
      }

      // Extract analyses from images
      for (const img of images) {
        if (img.analysis) {
          allAnalyses[img.id] = img.analysis;
        }
      }

      // Update store
      // Note: Don't worry about localStorage quota errors here - data is in database
      set({
        projectId,
        currentProperty: {
          id: projectResult.data.id,
          name: projectResult.data.name,
          address: projectResult.data.address,
          isNew: false,
        },
        uploadedImages: images.map((img: any) => ({
          id: img.id,
          file: null as any,
          dataUrl: img.original_url, // Full-size for viewer
          thumbnailUrl: img.thumbnail_url, // Thumbnail for grid
          name: img.id,
        })),
        roomAnalyses: allAnalyses,
        stagingResults: allStagingResults, // URLs from database - safe to persist
      });

      console.log(`✅ Project ${projectId} loaded successfully`);
    } catch (error) {
      console.error('Error loading project:', error);
      throw error;
    }
  },

  clearProject: () => {
    set({
      projectId: undefined,
      currentProperty: null,
      uploadedImages: [],
      roomAnalyses: {},
      stagingResults: {},
      roomConfigs: {},
      selectedMode: undefined,
      selectedPreset: undefined,
      currentStep: 'upload',
    });
  },

  deleteProject: async (projectId: string) => {
    const success = await deleteProjectFromDB(projectId);
    if (success) {
      // If the deleted project is the current one, clear it
      const state = get();
      if (state.projectId === projectId) {
        get().clearProject();
      }
      // Reload available properties
      await get().loadAvailableProperties();
    }
    return success;
  },

  reset: () => set(initialState),
}),
    {
      name: 'ai-staging-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        // ONLY persist lightweight navigation/UI state
        // All images and results come from Supabase database
        projectId: state.projectId,
        currentProperty: state.currentProperty,
        projectStyleGuide: state.projectStyleGuide,
        selectedMode: state.selectedMode,
        selectedPreset: state.selectedPreset,
        selectedRoomId: state.selectedRoomId,
        // Don't persist:
        // - currentStep (always start fresh on 'upload')
        // - uploadedImages (too large, in Supabase)
        // - roomAnalyses (load from DB)
        // - roomGroups (regenerate)
        // - roomConfigs (regenerate)
        // - stagingResults (too large, in Supabase)
        // - availableProperties (load fresh)
        // - isProcessing, error (UI state)
      }),
    }
  )
);
