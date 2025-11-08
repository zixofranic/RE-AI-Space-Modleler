-- Fix Storage RLS Policies for ALL Buckets
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Project: vtnptevlqclqkbricmah

-- =============================================
-- OPTION 1: Delete existing policies and recreate (RECOMMENDED)
-- =============================================

-- Drop existing policies (if they only apply to one bucket)
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Recreate policies that apply to ALL THREE buckets
-- =============================================

-- 1. Allow authenticated users to upload to any of the three buckets
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('original-images', 'staged-images', 'thumbnails')
);

-- 2. Allow public reads from all three buckets (since they're public)
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id IN ('original-images', 'staged-images', 'thumbnails')
);

-- 3. Allow authenticated users to update files in any of the three buckets
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id IN ('original-images', 'staged-images', 'thumbnails'));

-- 4. Allow authenticated users to delete files from any of the three buckets
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id IN ('original-images', 'staged-images', 'thumbnails'));

-- =============================================
-- VERIFICATION
-- =============================================

-- Check if all policies are created
SELECT
  policyname as "Policy Name",
  cmd as "Command (INSERT/SELECT/UPDATE/DELETE)",
  CASE
    WHEN roles::text LIKE '%authenticated%' THEN 'authenticated'
    WHEN roles::text LIKE '%public%' THEN 'public'
    ELSE roles::text
  END as "Applied To"
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- You should see 4 policies total:
-- 1. Allow authenticated deletes - DELETE - authenticated
-- 2. Allow authenticated updates - UPDATE - authenticated
-- 3. Allow authenticated uploads - INSERT - authenticated
-- 4. Allow public reads - SELECT - public

-- All of these policies apply to ALL THREE buckets via bucket_id IN (...)
