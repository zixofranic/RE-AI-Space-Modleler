-- Clean up duplicate and empty projects
-- Run this in Supabase SQL Editor to remove test data

-- Delete all existing data (start fresh)
DELETE FROM staging_results;
DELETE FROM images;
DELETE FROM projects;

-- Verify cleanup
SELECT 'Cleanup complete!' as status;

-- Check counts (should all be 0)
SELECT
  (SELECT COUNT(*) FROM projects) as projects_count,
  (SELECT COUNT(*) FROM images) as images_count,
  (SELECT COUNT(*) FROM staging_results) as staging_results_count;
