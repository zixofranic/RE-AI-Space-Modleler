-- Check Storage RLS Policies
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- View all storage.objects policies
SELECT
  policyname as "Policy Name",
  cmd as "Command",
  qual as "USING Clause",
  with_check as "WITH CHECK Clause"
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage';

-- This will show you the actual policy definitions
-- Look for policies that have bucket_id conditions
