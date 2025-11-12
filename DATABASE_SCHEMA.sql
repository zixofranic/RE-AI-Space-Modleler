-- AI Staging App Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- =============================================
-- DROP EXISTING TABLES (Clean slate)
-- =============================================
DROP TABLE IF EXISTS staging_results CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- IMAGES TABLE
-- =============================================
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  analysis JSONB DEFAULT '{}'::jsonb,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- STAGING RESULTS TABLE
-- =============================================
CREATE TABLE staging_results (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  staged_url TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  suggestions TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_images_project_id ON images(project_id);
CREATE INDEX IF NOT EXISTS idx_staging_results_image_id ON staging_results(image_id);
CREATE INDEX IF NOT EXISTS idx_staging_results_project_id ON staging_results(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_results ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (Public access for now - no auth required)
-- =============================================

-- Allow anyone to read all projects
CREATE POLICY "Allow public read access to projects"
ON projects FOR SELECT
TO public
USING (true);

-- Allow anyone to create projects
CREATE POLICY "Allow public insert to projects"
ON projects FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to update projects
CREATE POLICY "Allow public update to projects"
ON projects FOR UPDATE
TO public
USING (true);

-- Allow anyone to read images
CREATE POLICY "Allow public read access to images"
ON images FOR SELECT
TO public
USING (true);

-- Allow anyone to insert images
CREATE POLICY "Allow public insert to images"
ON images FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to update images
CREATE POLICY "Allow public update to images"
ON images FOR UPDATE
TO public
USING (true);

-- Allow anyone to read staging results
CREATE POLICY "Allow public read access to staging_results"
ON staging_results FOR SELECT
TO public
USING (true);

-- Allow anyone to insert staging results
CREATE POLICY "Allow public insert to staging_results"
ON staging_results FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to update staging results
CREATE POLICY "Allow public update to staging_results"
ON staging_results FOR UPDATE
TO public
USING (true);

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
-- VERIFICATION
-- =============================================
SELECT 'Tables created successfully!' as status;

-- View all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('projects', 'images', 'staging_results')
ORDER BY table_name;
