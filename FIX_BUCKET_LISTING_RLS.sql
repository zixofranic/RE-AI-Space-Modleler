-- Fix Bucket Listing RLS Issue
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This allows your app to actually SEE the buckets

-- =============================================
-- ALLOW PUBLIC TO LIST/READ BUCKETS
-- =============================================

-- Create policy to allow anyone to list buckets
CREATE POLICY "Allow public to list buckets"
ON storage.buckets
FOR SELECT
TO public
USING (true);

-- This allows supabase.storage.listBuckets() to work
-- Without this, the buckets exist but are invisible to the API

-- =============================================
-- VERIFICATION
-- =============================================

-- Check if policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename = 'buckets'
  AND schemaname = 'storage';

-- You should see: "Allow public to list buckets" - SELECT
