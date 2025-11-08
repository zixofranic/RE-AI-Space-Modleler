import { supabase, STORAGE_BUCKETS, isSupabaseConfigured } from './supabase';

/**
 * Check if Supabase storage buckets exist
 * Call this once during app initialization
 */
export async function setupSupabaseStorage() {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, skipping storage setup');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    console.log('🔧 Checking Supabase storage buckets...');

    const requiredBuckets = [
      { name: STORAGE_BUCKETS.ORIGINAL_IMAGES, purpose: 'Original uploaded room images' },
      { name: STORAGE_BUCKETS.STAGED_IMAGES, purpose: 'AI-generated staged images' },
      { name: STORAGE_BUCKETS.THUMBNAILS, purpose: 'Image thumbnails (future use)' },
    ];

    // Get existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      console.warn('💡 This might be an RLS policy issue. Try creating buckets manually in Supabase Dashboard.');
      return { success: false, error: listError.message };
    }

    const existingBucketNames = new Set(existingBuckets?.map((b) => b.name) || []);
    const missingBuckets: string[] = [];

    // Check which buckets exist
    for (const bucket of requiredBuckets) {
      if (existingBucketNames.has(bucket.name)) {
        console.log(`✅ Bucket "${bucket.name}" exists`);
      } else {
        console.warn(`⚠️ Bucket "${bucket.name}" not found`);
        missingBuckets.push(bucket.name);
      }
    }

    // If buckets are missing, provide instructions
    if (missingBuckets.length > 0) {
      console.log('\n📋 MANUAL SETUP REQUIRED:');
      console.log('Some storage buckets are missing. Please create them manually:');
      console.log('\n1. Go to Supabase Dashboard → Storage');
      console.log(`2. Create these buckets:\n`);

      requiredBuckets
        .filter(b => missingBuckets.includes(b.name))
        .forEach(bucket => {
          console.log(`   • ${bucket.name}`);
          console.log(`     Purpose: ${bucket.purpose}`);
          console.log(`     Settings: Public bucket, 50MB file limit\n`);
        });

      console.log('3. After creating buckets, refresh this page\n');

      return {
        success: false,
        error: 'Missing storage buckets',
        missingBuckets,
        needsManualSetup: true
      };
    }

    console.log('✅ All storage buckets verified!');
    return { success: true };
  } catch (error) {
    console.error('❌ Storage check failed:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Clear localStorage quota to fix "QuotaExceededError"
 * This should be called if user hits quota limits
 */
export function clearLocalStorageCache() {
  try {
    console.log('🧹 Clearing localStorage cache...');

    const storageKey = 'ai-staging-storage';
    const currentData = localStorage.getItem(storageKey);

    if (currentData) {
      const parsed = JSON.parse(currentData);

      // Keep only essential metadata, remove all data URLs
      const cleaned = {
        ...parsed,
        state: {
          ...parsed.state,
          uploadedImages: [], // Clear uploaded images (will reload from Supabase)
          stagingResults: {}, // Clear results (will reload from Supabase)
        },
      };

      localStorage.setItem(storageKey, JSON.stringify(cleaned));
      console.log('✅ localStorage cleared successfully');

      return { success: true };
    }

    return { success: true, message: 'No data to clear' };
  } catch (error) {
    console.error('❌ Failed to clear localStorage:', error);
    return { success: false, error: String(error) };
  }
}
