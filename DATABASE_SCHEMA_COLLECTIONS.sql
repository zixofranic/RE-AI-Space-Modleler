-- AI Staging App Database Schema - WITH COLLECTIONS
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- =============================================
-- DROP EXISTING TABLES (Clean slate)
-- =============================================
DROP TABLE IF EXISTS staging_results CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- =============================================
-- PROJECTS TABLE (Properties)
-- =============================================
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- COLLECTIONS TABLE (Rooms/Spaces)
-- =============================================
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Living Room", "Master Bedroom", etc.
  room_type TEXT, -- For grouping/filtering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- IMAGES TABLE
-- =============================================
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
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
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_collections_project_id ON collections(project_id);
CREATE INDEX IF NOT EXISTS idx_images_project_id ON images(project_id);
CREATE INDEX IF NOT EXISTS idx_images_collection_id ON images(collection_id);
CREATE INDEX IF NOT EXISTS idx_staging_results_image_id ON staging_results(image_id);
CREATE INDEX IF NOT EXISTS idx_staging_results_project_id ON staging_results(project_id);
CREATE INDEX IF NOT EXISTS idx_staging_results_collection_id ON staging_results(collection_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_results ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (Public access for now)
-- =============================================

-- Projects
CREATE POLICY "Allow public read access to projects" ON projects FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert to projects" ON projects FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update to projects" ON projects FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete to projects" ON projects FOR DELETE TO public USING (true);

-- Collections
CREATE POLICY "Allow public read access to collections" ON collections FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert to collections" ON collections FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update to collections" ON collections FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete to collections" ON collections FOR DELETE TO public USING (true);

-- Images
CREATE POLICY "Allow public read access to images" ON images FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert to images" ON images FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update to images" ON images FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete to images" ON images FOR DELETE TO public USING (true);

-- Staging Results
CREATE POLICY "Allow public read access to staging_results" ON staging_results FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert to staging_results" ON staging_results FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update to staging_results" ON staging_results FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete to staging_results" ON staging_results FOR DELETE TO public USING (true);

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'Tables created successfully!' as status;

-- View all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('projects', 'collections', 'images', 'staging_results')
ORDER BY table_name;
