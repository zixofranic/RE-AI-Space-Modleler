# Supabase Storage - Manual Setup Guide

## Why Manual Setup?

Creating storage buckets programmatically can trigger RLS (Row Level Security) policy errors:
```
new row violates row-level security policy for table "buckets"
```

**Solution:** Create buckets manually in the Supabase Dashboard (recommended approach).

---

## Step-by-Step Setup

### 1. Access Your Supabase Project

Go to: https://supabase.com/dashboard/project/vtnptevlqclqkbricmah

Or navigate to:
- Supabase Dashboard → Your Projects → `vtnptevlqclqkbricmah`

### 2. Navigate to Storage

- Click **"Storage"** in the left sidebar
- You should see the Storage management page

### 3. Create Required Buckets

You need to create **3 buckets**. For each bucket:

#### Bucket 1: `original-images`

1. Click **"New bucket"** button
2. Fill in details:
   - **Name:** `original-images`
   - **Public bucket:** ✅ **Enable** (allows image URLs to be accessed)
   - **File size limit:** `52428800` (50MB)
   - **Allowed MIME types:** `image/png, image/jpeg, image/jpg, image/webp`
3. Click **"Create bucket"**

**Purpose:** Stores original uploaded room photos

---

#### Bucket 2: `staged-images`

1. Click **"New bucket"** button
2. Fill in details:
   - **Name:** `staged-images`
   - **Public bucket:** ✅ **Enable**
   - **File size limit:** `52428800` (50MB)
   - **Allowed MIME types:** `image/png, image/jpeg, image/jpg, image/webp`
3. Click **"Create bucket"**

**Purpose:** Stores AI-generated staged images

---

#### Bucket 3: `thumbnails`

1. Click **"New bucket"** button
2. Fill in details:
   - **Name:** `thumbnails`
   - **Public bucket:** ✅ **Enable**
   - **File size limit:** `10485760` (10MB)
   - **Allowed MIME types:** `image/png, image/jpeg, image/jpg, image/webp`
3. Click **"Create bucket"**

**Purpose:** Future use for optimized thumbnail images

---

### 4. Verify Buckets Created

After creating all 3 buckets, you should see:

```
Storage
├── original-images (Public)
├── staged-images (Public)
└── thumbnails (Public)
```

---

### 5. Set Up Storage Policies (Optional but Recommended)

For better security, set up RLS policies on the storage objects:

1. Go to **Storage** → **Policies**
2. Click **"New Policy"**

#### Policy for Uploads (All Buckets)

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('original-images', 'staged-images', 'thumbnails')
);
```

#### Policy for Reads (All Buckets)

```sql
-- Allow public reads (since buckets are public)
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id IN ('original-images', 'staged-images', 'thumbnails')
);
```

#### Policy for Updates

```sql
-- Allow authenticated users to update their own objects
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id IN ('original-images', 'staged-images', 'thumbnails'));
```

#### Policy for Deletes

```sql
-- Allow authenticated users to delete objects
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id IN ('original-images', 'staged-images', 'thumbnails'));
```

---

## Verification

### Test Your Setup

1. **Refresh your app** (F5)
2. **Check browser console** (F12 → Console tab)
3. You should see:
   ```
   🔧 Checking Supabase storage buckets...
   ✅ Bucket "original-images" exists
   ✅ Bucket "staged-images" exists
   ✅ Bucket "thumbnails" exists
   ✅ All storage buckets verified!
   ```

### If Buckets Are Missing

If you see warnings like:
```
⚠️ Bucket "original-images" not found
📋 MANUAL SETUP REQUIRED:
```

**Action:** Go back to Step 3 and create the missing bucket(s).

---

## Troubleshooting

### Error: "Failed to list buckets"

**Possible causes:**
1. Invalid Supabase URL or API key in `.env`
2. RLS policies blocking access

**Solution:**
```bash
# Verify your .env file has correct values:
NEXT_PUBLIC_SUPABASE_URL=https://vtnptevlqclqkbricmah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Error: "new row violates row-level security policy"

**This means:** You're trying to create buckets programmatically, which is blocked by RLS.

**Solution:** Use manual setup (this guide) instead of programmatic creation.

### Bucket Already Exists

If you accidentally created buckets with wrong settings:

1. Go to Storage → Click on bucket name
2. Click **"Settings"** (gear icon)
3. Adjust settings OR delete and recreate

---

## Alternative: Disable RLS (Development Only)

**⚠️ WARNING:** Only for development/testing, NEVER in production!

```sql
-- Run in Supabase SQL Editor
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Remember to re-enable before production:**
```sql
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

---

## Next Steps

Once all 3 buckets are created:

1. ✅ Buckets verified in console
2. ✅ Upload test image
3. ✅ Generate staging
4. ✅ Check Supabase Storage → Buckets → Verify images uploaded

Your storage is now ready! Images will automatically upload to Supabase instead of localStorage.

---

## Quick Reference

**Bucket Settings:**
- **Public:** Yes (allows image URLs to work)
- **Size limit:** 50MB (original/staged), 10MB (thumbnails)
- **MIME types:** PNG, JPEG, JPG, WebP

**Dashboard URL:**
https://supabase.com/dashboard/project/vtnptevlqclqkbricmah/storage/buckets

**Required Buckets:**
1. `original-images` - Original room photos
2. `staged-images` - AI-generated results
3. `thumbnails` - Future optimization

---

**Setup Time:** ~2-3 minutes
**Difficulty:** Easy
**One-time setup:** Yes
