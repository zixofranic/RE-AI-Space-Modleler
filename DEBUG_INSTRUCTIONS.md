# 🐛 Debug Instructions

## Quick Debug Steps

### 1. Check Browser Console Logs

When you generate/edit staging, look for these console messages:

**After Upload/Analysis:**
```
✅ Saved X images to database for project [PROJECT-ID]
```

**After Generation:**
```
✅ Project saved to database: [PROJECT-ID]
✅ Image saved to database: [IMAGE-ID]
✅ Staging result saved to database: [RESULT-ID]
```

### 2. Check What's in LocalStorage

Open browser console (F12) and run:

```javascript
// Get current store data
const store = JSON.parse(localStorage.getItem('ai-staging-storage'));

console.log('=== CURRENT PROJECT ===');
console.log('Project ID:', store.state.projectId);
console.log('Images:', store.state.uploadedImages.length);
console.log('Staging Results:');
Object.entries(store.state.stagingResults || {}).forEach(([imageId, results]) => {
  console.log(`  Image ${imageId}: ${results.length} version(s)`);
});
```

### 3. Check What's in Database

Run this in Supabase SQL Editor:

```sql
-- See all projects
SELECT id, name, created_at FROM projects ORDER BY created_at DESC;

-- See all images
SELECT id, project_id, uploaded_at FROM images ORDER BY uploaded_at DESC;

-- See all staging results
SELECT id, project_id, image_id, created_at FROM staging_results ORDER BY created_at DESC;
```

### 4. Compare IDs

Make sure:
- ✅ localStorage projectId matches database project id
- ✅ image IDs in localStorage match image IDs in database
- ✅ staging result image_id matches the actual image id

---

## Common Issues

### Issue: "Versions 1-2 on first generation"
**Cause**: GenerationStep running twice (React Strict Mode)
**Fix**: Already applied - added `hasStarted` check

### Issue: "Wrong images in My Projects"
**Possible Causes**:
1. Old test data in database
2. ProjectId mismatch
3. Multiple browser sessions with different projectIds

**Fix**:
1. Run cleanup SQL (delete all data)
2. Clear localStorage
3. Start fresh upload

### Issue: "My edits don't show up"
**Possible Causes**:
1. Database save failing silently
2. ProjectId changed between sessions
3. Results saved to wrong project

**Fix**: Check console for database save errors

---

## Complete Fresh Start

If things are really messed up:

### 1. Clear Database
```sql
DELETE FROM staging_results;
DELETE FROM images;
DELETE FROM projects;
```

### 2. Clear Browser
```javascript
localStorage.clear();
location.reload();
```

### 3. New Upload
- Upload 1 test image
- Check console: Should see ONE projectId throughout
- Generate staging
- Check console: Should see database saves with SAME projectId
- Visit My Projects: Should see ONE project with ONE image

### 4. Test Edit
- Edit the image
- Check console: Should use SAME projectId
- Should create version 2 in SAME project
- My Projects: Should show 1 project, 1 image, 2 versions

---

## Expected Console Flow

**Upload:**
```
📤 Uploading image bedroom.jpg to Supabase...
✅ Image uploaded to Supabase: https://...
✅ Saved 1 images to database for project project-1234567890-abc
```

**Generate:**
```
✅ Project saved to database: project-1234567890-abc
✅ Image saved to database: img-123
✅ Staged image uploaded to Supabase: https://...
✅ Staging result saved to database: result-img-123-1234567890
```

**Edit:**
```
✅ Staged image uploaded to Supabase: https://...
✅ Project saved to database: project-1234567890-abc  ← SAME ID
✅ Image saved to database: img-123  ← SAME ID
✅ Staging result saved to database: result-img-123-9876543210
```

All using the **SAME project ID!**
