import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * DELETE endpoint to cleanup all test data
 * Keeps table structures, deletes all records and files
 */
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    );
  }

  try {
    const results = {
      stagedImages: 0,
      originalImages: 0,
      thumbnails: 0,
      stagingResults: 0,
      images: 0,
      projects: 0,
    };

    // 1. Delete all files from staged-images bucket (including folders)
    console.log('📦 Cleaning staged-images bucket...');
    const { data: stagedFiles } = await supabase.storage
      .from('staged-images')
      .list();

    if (stagedFiles && stagedFiles.length > 0) {
      for (const folder of stagedFiles) {
        // List all files in the folder
        const { data: filesInFolder } = await supabase.storage
          .from('staged-images')
          .list(folder.name);

        if (filesInFolder && filesInFolder.length > 0) {
          const filePaths = filesInFolder.map(f => `${folder.name}/${f.name}`);
          await supabase.storage
            .from('staged-images')
            .remove(filePaths);
        }
      }
      results.stagedImages = stagedFiles.length;
      console.log(`✅ Deleted ${stagedFiles.length} folders from staged-images`);
    }

    // 2. Delete all files from original-images bucket
    console.log('📦 Cleaning original-images bucket...');
    const { data: originalFiles } = await supabase.storage
      .from('original-images')
      .list();

    if (originalFiles && originalFiles.length > 0) {
      const originalPaths = originalFiles.map(f => f.name);
      await supabase.storage
        .from('original-images')
        .remove(originalPaths);
      results.originalImages = originalFiles.length;
      console.log(`✅ Deleted ${originalFiles.length} files from original-images`);
    }

    // 3. Delete all files from thumbnails bucket
    console.log('📦 Cleaning thumbnails bucket...');
    const { data: thumbnailFiles } = await supabase.storage
      .from('thumbnails')
      .list();

    if (thumbnailFiles && thumbnailFiles.length > 0) {
      const thumbnailPaths = thumbnailFiles.map(f => f.name);
      await supabase.storage
        .from('thumbnails')
        .remove(thumbnailPaths);
      results.thumbnails = thumbnailFiles.length;
      console.log(`✅ Deleted ${thumbnailFiles.length} files from thumbnails`);
    }

    // 4. Delete all staging results from database
    console.log('🗄️ Cleaning staging_results table...');
    const { error: resultsError } = await supabase
      .from('staging_results')
      .delete()
      .neq('id', 'impossible-id-to-match-everything'); // Delete all

    if (resultsError) {
      console.error('❌ Error deleting staging results:', resultsError);
    } else {
      console.log('✅ Deleted all staging results');
    }

    // 5. Delete all images from database
    console.log('🗄️ Cleaning images table...');
    const { error: imagesError } = await supabase
      .from('images')
      .delete()
      .neq('id', 'impossible-id-to-match-everything'); // Delete all

    if (imagesError) {
      console.error('❌ Error deleting images:', imagesError);
    } else {
      console.log('✅ Deleted all images');
    }

    // 6. Delete all projects from database
    console.log('🗄️ Cleaning projects table...');
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .neq('id', 'impossible-id-to-match-everything'); // Delete all

    if (projectsError) {
      console.error('❌ Error deleting projects:', projectsError);
    } else {
      console.log('✅ Deleted all projects');
    }

    console.log('✨ Cleanup complete!');

    return NextResponse.json({
      success: true,
      message: 'All test data has been removed',
      results,
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    );
  }
}
