# Fix for Project Deletion Issue

## Root Cause
The project deletion was failing because **Supabase Row Level Security (RLS) policies were missing DELETE permissions**. The database had policies for SELECT, INSERT, and UPDATE operations, but no DELETE policies were defined for any tables.

## The Fix

### 1. Apply the DELETE Policies to Your Supabase Database

Run the SQL script in `FIX_DELETE_POLICIES.sql` in your Supabase Dashboard:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor → New Query
3. Copy and paste the contents of `FIX_DELETE_POLICIES.sql`
4. Click "Run"

This will add the following policies:
- `Allow public delete projects` - Enables deletion of projects
- `Allow public delete images` - Enables deletion of images
- `Allow public delete staging_results` - Enables deletion of staging results

### 2. Code Improvements Applied

The following code improvements have been made to better handle and debug deletion issues:

#### `lib/db.ts`:
- Added detailed logging throughout the deletion process
- Enhanced error handling with specific RLS policy detection
- Logs detailed error information including error codes and hints

#### `app/project/[id]/page.tsx`:
- Added console logging for debugging
- Improved error messages to indicate potential RLS policy issues
- Better user feedback when deletion fails

## How the Deletion Process Works

1. **User Action**: User clicks "Delete Project" and confirms in the popup
2. **Storage Cleanup**: The system first deletes all associated files from Supabase storage:
   - Original images from `original-images` bucket
   - Staged images from `staged-images` bucket (nested in folders)
   - Thumbnails from `thumbnails` bucket
3. **Database Deletion**: Finally deletes the project record from the database
   - This triggers CASCADE DELETE for related `images` and `staging_results` records

## Testing the Fix

1. Apply the SQL fixes as described above
2. Navigate to a project detail page
3. Click "Delete Project"
4. Confirm deletion in the popup
5. Check the browser console for detailed logs
6. The project should be deleted and you'll be redirected to `/projects`

## Troubleshooting

If deletion still fails after applying the fix:

1. **Check Browser Console**: Look for error messages, especially those mentioning:
   - Error code `42501` (insufficient privilege)
   - "policy" in the error message

2. **Verify Policies Applied**: Run this query in Supabase SQL Editor:
   ```sql
   SELECT tablename, policyname, cmd
   FROM pg_policies
   WHERE tablename IN ('projects', 'images', 'staging_results')
   AND cmd = 'DELETE';
   ```
   You should see three DELETE policies.

3. **Check Supabase Configuration**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correctly set in your `.env` file.

## Summary

The root cause was simple: **missing DELETE policies in the Row Level Security configuration**. Once these policies are added to Supabase, project deletion will work correctly, removing both storage files and database records as intended.