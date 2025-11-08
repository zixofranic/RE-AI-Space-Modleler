-- Fix Public Upload Policy
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This allows anonymous users to upload images

-- =============================================
-- ALLOW PUBLIC (ANONYMOUS) UPLOADS
-- =============================================

-- Drop the old "authenticated only" upload policy
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Recreate to allow BOTH public and authenticated users to upload
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id IN ('original-images', 'staged-images', 'thumbnails')
);

-- Note: "public" includes both anonymous (anon key) and authenticated users
-- This is safe for your use case since these are public buckets anyway

-- =============================================
-- VERIFICATION
-- =============================================

-- Check if policy was created
SELECT
  policyname as "Policy Name",
  cmd as "Command",
  CASE
    WHEN roles::text LIKE '%public%' THEN 'public (includes anon + authenticated)'
    WHEN roles::text LIKE '%authenticated%' THEN 'authenticated only'
    ELSE roles::text
  END as "Who Can Use"
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND cmd = 'INSERT';

-- You should see: "Allow public uploads" - INSERT - public
