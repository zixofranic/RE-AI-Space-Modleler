# 🚀 Next Steps - Complete Implementation Guide

## What's Been Completed ✅

1. **Database Schema**
   - Migration file created: `supabase/migrations/003_add_property_fields.sql`
   - Adds: `address`, `property_type`, `notes` columns to projects table

2. **Types Updated**
   - Added `Property` interface
   - Added `MAX_VERSIONS_PER_IMAGE = 4` constant
   - Updated `AppState` with property management fields

3. **PropertySelector Component Created**
   - File: `components/upload/PropertySelector.tsx`
   - Allows creating new property or selecting existing
   - Inline UI at top of upload page

## What Still Needs Implementation 🔨

### Step 1: Update Store (lib/store.ts)

Add to `initialState`:
```typescript
const initialState: AppState = {
  // ... existing fields
  currentProperty: null,
  availableProperties: [],
};
```

Add new actions to the store:
```typescript
interface AppActions {
  // ... existing actions

  // Property Management
  setCurrentProperty: (property: { id: string; name: string; address?: string; isNew: boolean } | null) => void;
  loadAvailableProperties: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  clearProject: () => void;
}
```

Implementation:
```typescript
// Inside create<AppState & AppActions>() function:

// Property Management
setCurrentProperty: (property) => {
  set({ currentProperty: property });
  if (property) {
    set({ projectId: property.id });
  }
},

loadAvailableProperties: async () => {
  try {
    const result = await getProjectsWithThumbnails(50);
    if (result.success && result.data) {
      const properties: Property[] = result.data.map((p: any) => ({
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
    // 1. Load project data
    const projectResult = await getProject(projectId);
    if (!projectResult.success) throw new Error('Project not found');

    // 2. Load all images for this project
    const imagesResult = await getProjectImages(projectId);
    if (!imagesResult.success) throw new Error('Failed to load images');

    // 3. Load all staging results for each image
    const images = imagesResult.data || [];
    const allStagingResults: Record<string, StagingResult[]> = {};
    const allAnalyses: Record<string, RoomAnalysis> = {};

    for (const img of images) {
      // Load staging results
      const resultsData = await getStagingResultsForImage(img.id);
      if (resultsData.success && resultsData.data) {
        allStagingResults[img.id] = resultsData.data;
      }

      // Store analysis
      if (img.analysis) {
        allAnalyses[img.id] = img.analysis;
      }
    }

    // 4. Update store
    set({
      projectId,
      currentProperty: {
        id: projectResult.data.id,
        name: projectResult.data.name,
        address: projectResult.data.address,
        isNew: false,
      },
      uploadedImages: images.map(img => ({
        id: img.id,
        file: null as any, // Not needed for loaded projects
        dataUrl: img.original_url,
        name: img.id,
      })),
      roomAnalyses: allAnalyses,
      stagingResults: allStagingResults,
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
```

### Step 2: Add PropertySelector to Upload Page

File: `app/page.tsx`

Add import:
```typescript
import { PropertySelector } from '@/components/upload/PropertySelector';
```

Add before ImageUploader (around line 237):
```typescript
{currentStep === 'upload' && (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Upload Your Room Photos
      </h2>
      <p className="text-lg text-gray-600">
        Add all the empty room images you want to stage
      </p>
    </div>

    {/* ADD THIS */}
    <PropertySelector />

    <ImageUploader />

    {/* ... rest */}
  </div>
)}
```

### Step 3: Create Project Detail Page

File: `app/project/[id]/page.tsx` (NEW FILE)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ArrowLeft, Download, Edit, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    // Already loaded in store, just navigate
    setStep('results');
    router.push('/');
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
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
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

        {/* Images with Version History */}
        <div className="space-y-8">
          {uploadedImages.map((image) => {
            const versions = stagingResults[image.id] || [];
            const canEdit = versions.length < MAX_VERSIONS_PER_IMAGE;

            return (
              <div key={image.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Original Image */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <img
                      src={image.dataUrl}
                      alt="Original"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Original Image</h3>
                      <p className="text-sm text-gray-600">{image.name}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {versions.length} version{versions.length !== 1 ? 's' : ''}
                        {!canEdit && (
                          <span className="ml-2 text-amber-600">(Maximum {MAX_VERSIONS_PER_IMAGE} versions reached)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Versions */}
                {versions.length > 0 && (
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Staged Versions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {versions.map((version, idx) => (
                        <div key={idx} className="group relative">
                          <img
                            src={version.stagedImageUrl}
                            alt={`Version ${idx + 1}`}
                            className="w-full aspect-video object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDownloadVersion(version.stagedImageUrl!, image.name, idx + 1)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-center mt-2 text-sm text-gray-600">
                            Version {idx + 1}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Continue Editing Button */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <Button
                    onClick={() => handleContinueEditing(image.id)}
                    disabled={!canEdit}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {canEdit ? 'Continue Editing' : `Maximum ${MAX_VERSIONS_PER_IMAGE} Versions Reached`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Update ResultsView to Show Version Limit

File: `components/results/ResultsView.tsx`

Find the "Edit This Image" button and update:
```typescript
const canEdit = selectedResults.length < MAX_VERSIONS_PER_IMAGE;

// ... in render:
<Button
  size="lg"
  variant="outline"
  onClick={() => setShowEditDialog(true)}
  disabled={!canEdit}
>
  <Edit2 className="w-4 h-4 mr-2" />
  {canEdit ? 'Edit This Image' : `Max ${MAX_VERSIONS_PER_IMAGE} Versions`}
</Button>

{!canEdit && (
  <p className="text-sm text-amber-600 mt-2">
    Maximum {MAX_VERSIONS_PER_IMAGE} versions per image (1 initial + 3 edits)
  </p>
)}
```

### Step 5: Add Database Helper Functions

File: `lib/database.ts`

Add these functions:
```typescript
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

export async function getProjectImages(projectId: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error getting project images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get images',
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
```

### Step 6: Update Projects Page to Show Address

File: `app/projects/page.tsx`

Update the project card to show address:
```typescript
<div className="p-6">
  <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
    {project.name}
  </h3>

  {/* ADD THIS */}
  {project.address && (
    <p className="text-sm text-gray-600 mb-3">{project.address}</p>
  )}

  <div className="flex items-center text-sm text-gray-600 mb-3">
    <Calendar className="w-4 h-4 mr-2" />
    {formatDate(project.updated_at)}
  </div>
  {/* ... rest */}
</div>
```

## Testing Checklist ✅

1. **Create New Property**
   - [ ] Visit homepage
   - [ ] See PropertySelector
   - [ ] Create new property with name and address
   - [ ] Upload images
   - [ ] Verify property saved to database

2. **Add to Existing Property**
   - [ ] Return to homepage
   - [ ] Select "Add to Existing"
   - [ ] Choose previous property from dropdown
   - [ ] Upload more images
   - [ ] Verify images added to same project

3. **View Project**
   - [ ] Go to "My Projects"
   - [ ] Click on a property
   - [ ] See all images with version history
   - [ ] See version thumbnails

4. **Continue Editing**
   - [ ] Click "Continue Editing" on an image
   - [ ] App loads with that image
   - [ ] Edit to create new version
   - [ ] New version appears in version history

5. **Version Limit**
   - [ ] Generate V1
   - [ ] Edit to create V2
   - [ ] Edit to create V3
   - [ ] Edit to create V4
   - [ ] Verify "Continue Editing" is disabled
   - [ ] See message about max versions

## Common Issues & Solutions

### Issue: PropertySelector not showing
**Solution:** Make sure you imported and added it to app/page.tsx

### Issue: Store actions not found
**Solution:** Make sure you added all the new actions to the store interface and implementation

### Issue: Migration not applied
**Solution:** Run the SQL from `003_add_property_fields.sql` manually in Supabase SQL Editor

### Issue: Project detail page not found
**Solution:** Make sure the file is at `app/project/[id]/page.tsx` (singular "project", not "projects")

## Summary

This implementation gives users:
- ✅ Property naming and organization
- ✅ Add images to new or existing properties
- ✅ Full version history (up to 4 versions per image)
- ✅ Continue editing any project
- ✅ Version limit enforcement (1 initial + 3 edits)

All data persists to Supabase and can be accessed across sessions.
