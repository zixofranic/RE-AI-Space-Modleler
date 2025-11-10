/**
 * Cleanup script to delete all test data from Supabase
 * Keeps table structures, deletes all records and files
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

async function cleanupAllData() {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is not configured');
    process.exit(1);
  }

  console.log('🧹 Starting cleanup of all test data...\n');

  // 1. Delete all files from staged-images bucket
  console.log('📦 Cleaning staged-images bucket...');
  const { data: stagedFiles } = await supabase.storage
    .from('staged-images')
    .list();

  if (stagedFiles && stagedFiles.length > 0) {
    const stagedPaths = stagedFiles.map(f => f.name);
    const { error: stagedError } = await supabase.storage
      .from('staged-images')
      .remove(stagedPaths);

    if (stagedError) {
      console.error('❌ Error deleting staged images:', stagedError);
    } else {
      console.log(`✅ Deleted ${stagedPaths.length} folders from staged-images`);
    }
  } else {
    console.log('✅ staged-images bucket already empty');
  }

  // 2. Delete all files from original-images bucket
  console.log('\n📦 Cleaning original-images bucket...');
  const { data: originalFiles } = await supabase.storage
    .from('original-images')
    .list();

  if (originalFiles && originalFiles.length > 0) {
    const originalPaths = originalFiles.map(f => f.name);
    const { error: originalError } = await supabase.storage
      .from('original-images')
      .remove(originalPaths);

    if (originalError) {
      console.error('❌ Error deleting original images:', originalError);
    } else {
      console.log(`✅ Deleted ${originalPaths.length} files from original-images`);
    }
  } else {
    console.log('✅ original-images bucket already empty');
  }

  // 3. Delete all files from thumbnails bucket
  console.log('\n📦 Cleaning thumbnails bucket...');
  const { data: thumbnailFiles } = await supabase.storage
    .from('thumbnails')
    .list();

  if (thumbnailFiles && thumbnailFiles.length > 0) {
    const thumbnailPaths = thumbnailFiles.map(f => f.name);
    const { error: thumbnailError } = await supabase.storage
      .from('thumbnails')
      .remove(thumbnailPaths);

    if (thumbnailError) {
      console.error('❌ Error deleting thumbnails:', thumbnailError);
    } else {
      console.log(`✅ Deleted ${thumbnailPaths.length} files from thumbnails`);
    }
  } else {
    console.log('✅ thumbnails bucket already empty');
  }

  // 4. Delete all staging results from database
  console.log('\n🗄️ Cleaning staging_results table...');
  const { error: resultsError, count: resultsCount } = await supabase
    .from('staging_results')
    .delete()
    .neq('id', 'impossible-id-to-match-everything'); // Delete all

  if (resultsError) {
    console.error('❌ Error deleting staging results:', resultsError);
  } else {
    console.log(`✅ Deleted all staging results`);
  }

  // 5. Delete all images from database
  console.log('\n🗄️ Cleaning images table...');
  const { error: imagesError, count: imagesCount } = await supabase
    .from('images')
    .delete()
    .neq('id', 'impossible-id-to-match-everything'); // Delete all

  if (imagesError) {
    console.error('❌ Error deleting images:', imagesError);
  } else {
    console.log(`✅ Deleted all images`);
  }

  // 6. Delete all projects from database
  console.log('\n🗄️ Cleaning projects table...');
  const { error: projectsError, count: projectsCount } = await supabase
    .from('projects')
    .delete()
    .neq('id', 'impossible-id-to-match-everything'); // Delete all

  if (projectsError) {
    console.error('❌ Error deleting projects:', projectsError);
  } else {
    console.log(`✅ Deleted all projects`);
  }

  console.log('\n✨ Cleanup complete! All test data has been removed.');
  console.log('📋 Database tables are preserved and ready for fresh data.');
}

cleanupAllData().catch(console.error);
