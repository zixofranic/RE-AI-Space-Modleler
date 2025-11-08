# Database Save/Retrieve System - Complete Guide

## How It Works (Automatic)

### Saving Images
When you upload images, the system automatically:

```typescript
// In lib/store.ts - addImages() function
1. User uploads image → Creates data URL
2. Generate unique projectId (if first upload)
3. Upload to Supabase Storage: 'original-images' bucket
4. Save URL to localStorage (not the large base64 data)
```

**Console logs you'll see:**
```
📤 Uploading image bedroom.jpg to Supabase...
✅ Image uploaded to Supabase: https://vtnptevlqclqkbricmah.supabase.co/storage/v1/object/public/original-images/project-123/image-456.jpg
```

### Saving Staging Results
When AI generates staged images:

```typescript
// In lib/store.ts - setStagingResult() function
1. AI generates staged image → Returns data URL
2. Convert data URL to Blob
3. Upload to Supabase Storage: 'staged-images' bucket
4. Save URL to localStorage
```

**Console logs:**
```
📤 Uploading staged image for 1234-abcd to Supabase...
✅ Staged image uploaded to Supabase: https://vtnptevlqclqkbricmah.supabase.co/...
```

## Retrieving Images

### Automatic Retrieval
Images are retrieved automatically:
- On page load, Zustand hydrates from localStorage
- localStorage contains Supabase URLs (not base64 data)
- Browser fetches images directly from Supabase URLs

### Manual Retrieval (For Collections Feature)

```typescript
// Get all images for a project
import { getProjectImages, getStagingResults } from '@/lib/db';

async function loadProject(projectId: string) {
  // Get original images
  const images = await getProjectImages(projectId);

  // Get staging results
  const results = await getStagingResults(projectId);

  return { images, results };
}
```

## Project Organization

Each session gets a unique `projectId`:
```
project-1762574387526-rwjb8kw5s/
  ├── original-images/
  │   ├── image-abc123.jpg  (original uploaded photo)
  │   ├── image-def456.jpg
  └── staged-images/
      ├── image-abc123/
      │   └── final.png      (AI-generated result)
      └── image-def456/
          └── final.png
```

## Verifying Data in Supabase

### Via Dashboard:
1. Go to: https://supabase.com/dashboard/project/vtnptevlqclqkbricmah
2. Click "Storage" → "original-images" bucket
3. You'll see folders named `project-[timestamp]-[random]`
4. Click folder → See your uploaded images

### Via Code:
```typescript
import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';

// List all files in original-images bucket
const { data, error } = await supabase.storage
  .from(STORAGE_BUCKETS.ORIGINAL_IMAGES)
  .list('project-123');

console.log('Files:', data);
```

## Current State

**What's Already Saved:**
- ✅ Original images → Supabase Storage (`original-images` bucket)
- ✅ Staged images → Supabase Storage (`staged-images` bucket)
- ✅ Metadata → localStorage (projectId, image names, URLs)

**What's NOT Yet Saved:**
- ❌ Room analyses → Not in Supabase tables yet (only localStorage)
- ❌ Room configs → Not in Supabase tables yet
- ❌ Projects metadata → Not in Supabase tables yet

## Next Steps for Full Database Integration

To save metadata to Supabase tables (not just Storage):

```typescript
import { createProject, saveImage, saveRoomAnalysis, saveStagingResult } from '@/lib/db';

// 1. Create a project
const project = await createProject('My Virtual Staging Project');

// 2. Save image metadata
await saveImage(project.id, uploadedImage, supabaseImageUrl);

// 3. Save room analysis
await saveRoomAnalysis(imageId, analysisData);

// 4. Save staging result
await saveStagingResult(imageId, resultData);
```

**Note:** The SQL tables exist in `supabase/schema.sql` but need to be run in Supabase dashboard to activate them.

## Running SQL Schema (One-Time Setup)

To enable full database features:

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/vtnptevlqclqkbricmah/sql
2. Click "New Query"
3. Copy contents of `supabase/schema.sql`
4. Run query
5. Verify tables created: Projects, Images, Room Analyses, etc.

Once done, you can:
- Save projects with names
- Query all projects by user
- Load previous projects
- Share projects via URLs
