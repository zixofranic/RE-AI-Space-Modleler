# 🗄️ Database Integration

Your AI Virtual Staging app now supports **Supabase** for persistent cloud storage!

## 🎯 How It Works

The app uses a **hybrid storage system**:

- **WITHOUT Supabase:** Uses localStorage (browser storage, lost on clear data)
- **WITH Supabase:** Automatically syncs to cloud database + file storage

### Current State: localStorage Only

Right now, your app is using **localStorage** because Supabase isn't configured yet. This means:
- ✅ Data persists on page refresh
- ❌ Data is lost if you clear browser data
- ❌ Can't access from other devices
- ❌ Limited to ~10MB storage

### After Setting Up Supabase:

Once configured, you get:
- ✅ **Cloud PostgreSQL database** for all metadata
- ✅ **File storage** for images (1GB free!)
- ✅ **Access from anywhere** - projects sync across devices
- ✅ **Persistent forever** - not tied to browser
- ✅ **Ready for multi-user** (add auth later)
- ✅ **Automatic fallback** - if Supabase is down, uses localStorage

## 🚀 Setting Up Supabase (5 Minutes)

### Quick Start

1. **Create Account:** Go to [supabase.com](https://supabase.com) and sign up
2. **Create Project:** Click "New Project" (takes 2 mins to provision)
3. **Get Credentials:** Settings → API → Copy URL and anon key
4. **Add to .env:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key...
   ```
5. **Run SQL:** Copy `supabase/schema.sql` → Supabase SQL Editor → Run
6. **Create Buckets:** Storage → Create `original-images`, `staged-images`, `thumbnails` (all public)
7. **Restart Server:** `npm run dev`

### Detailed Guide

See **[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)** for step-by-step instructions with screenshots.

## 📊 Database Schema

The app stores:

### Tables
- **`projects`** - Your staging projects
- **`images`** - Uploaded room photos
- **`room_analyses`** - AI room analysis results
- **`room_configs`** - Design configurations per room
- **`staging_results`** - Generated staged images
- **`edit_history`** - Track your 3 edits per image
- **`room_groups`** - Multi-angle room grouping

### Storage Buckets
- **`original-images/`** - Original uploaded photos
- **`staged-images/`** - AI-generated results
- **`thumbnails/`** - Image thumbnails (optional)

## 🔄 Migration Path

### Option 1: Start Fresh with Supabase
1. Set up Supabase (see above)
2. Clear localStorage: Click "Clear All Data" button
3. Upload images again - they'll go straight to Supabase

### Option 2: Keep Current Project
1. Set up Supabase
2. App will continue using current localStorage project
3. New projects will automatically use Supabase
4. Old project data stays in localStorage (hybrid mode)

### Option 3: Manual Migration (Advanced)
If you have important data in localStorage and want to migrate:
1. Export current project data (we can add export feature)
2. Set up Supabase
3. Import data to Supabase (we can add import feature)

**For now, easiest is Option 1 or 2.**

## 💾 How Data Flows

### Without Supabase:
```
Upload Image → localStorage
Generate → localStorage
Edit → localStorage
Download → From localStorage
```

### With Supabase:
```
Upload Image → Supabase Storage + PostgreSQL
Generate → Supabase Storage + PostgreSQL
Edit → Supabase Storage + PostgreSQL
Download → From Supabase Storage
```

### Hybrid (Supabase configured but offline):
```
Upload Image → Try Supabase → Fallback to localStorage
Generate → Try Supabase → Fallback to localStorage
```

## 🎨 Code Architecture

### Files Created
- **`lib/supabase.ts`** - Supabase client config
- **`lib/db.ts`** - Database utility functions (CRUD operations)
- **`lib/store-db.ts`** - Enhanced Zustand store with DB sync
- **`supabase/schema.sql`** - Database schema
- **`supabase/storage-setup.md`** - Storage bucket config

### Key Features
- **Automatic sync:** Every state change syncs to Supabase
- **Optimistic updates:** UI updates immediately, syncs in background
- **Error handling:** Falls back to localStorage if Supabase fails
- **Type-safe:** Full TypeScript support

## 🔐 Security & Authentication

### Current State (Public)
- All data is publicly accessible (no auth)
- Anyone can create/view/edit projects
- Perfect for development and testing

### Future: Add Authentication
When ready, you can easily add user accounts:
1. Enable Supabase Auth
2. Update RLS policies to filter by user_id
3. Add login/signup UI
4. Each user sees only their own projects

## 📈 Free Tier Limits

Supabase free tier includes:
- **500MB** database storage
- **1GB** file storage
- **2GB** bandwidth per month
- **Unlimited** API requests

For reference:
- 1000 images ≈ 500MB storage
- Perfect for personal use or small business

## 🆘 Troubleshooting

### "Supabase credentials not found" warning
- Check `.env` file has both URL and anon key
- Restart dev server after adding credentials

### Images showing as broken
- Verify storage buckets are set to "Public"
- Check storage policies are created
- Look for errors in browser console

### Data not syncing
- Check browser console for Supabase errors
- Verify SQL schema was run successfully
- Make sure buckets exist and are public

### Want to disable Supabase temporarily
- Just remove or comment out the env variables:
  ```bash
  # NEXT_PUBLIC_SUPABASE_URL=...
  # NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```
- App will automatically fall back to localStorage

## 🎯 Next Steps

1. **Now:** App works with localStorage
2. **Optional:** Set up Supabase (5 mins) for cloud storage
3. **Later:** Add authentication for multi-user support
4. **Future:** Add team collaboration features

## Questions?

- Supabase Docs: https://supabase.com/docs
- Need help? Check `SETUP_SUPABASE.md`
