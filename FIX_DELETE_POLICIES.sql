-- Fix Missing DELETE Policies for AI Staging App
-- The root cause of project deletion failure: No DELETE policies exist!
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- =============================================
-- ADD DELETE POLICIES FOR ALL TABLES
-- =============================================

-- Allow anyone to delete projects
CREATE POLICY "Allow public delete projects"
ON projects FOR DELETE
TO public
USING (true);

-- Allow anyone to delete images
CREATE POLICY "Allow public delete images"
ON images FOR DELETE
TO public
USING (true);

-- Allow anyone to delete staging results
CREATE POLICY "Allow public delete staging_results"
ON staging_results FOR DELETE
TO public
USING (true);

-- =============================================
-- VERIFY POLICIES
-- =============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('projects', 'images', 'staging_results')
ORDER BY tablename, cmd;