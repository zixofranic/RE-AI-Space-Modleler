# 🔐 Authentication Setup Guide

## Overview

The application now includes Google and Apple authentication powered by Supabase Auth.

---

## ✅ What's Implemented

### 1. **Auth Context & Provider**
**File**: `lib/auth-context.tsx`

Provides authentication state throughout the app:
```typescript
const { user, session, loading, signInWithGoogle, signInWithApple, signOut } = useAuth();
```

**Features**:
- Automatic session management
- Real-time auth state updates
- Graceful handling when Supabase is not configured

### 2. **Login Page**
**File**: `app/login/page.tsx`

Beautiful login interface with:
- Google OAuth button
- Apple Sign In button
- Loading states
- Error handling
- Automatic redirect after login

### 3. **Auth Callback Handler**
**File**: `app/auth/callback/page.tsx`

Handles OAuth redirects from Google/Apple:
- Completes authentication flow
- Redirects to home on success
- Shows error messages on failure

### 4. **User Menu Component**
**File**: `components/auth/UserMenu.tsx`

Dropdown menu showing:
- User avatar (first letter of name)
- User email
- "My Projects" link
- "Settings" link
- Sign Out button

**Added to**:
- Main app page (`app/page.tsx`)
- Projects page (`app/projects/page.tsx`)

---

## 🔧 Supabase Configuration Required

### Step 1: Enable Authentication Providers

In your Supabase dashboard:

1. **Go to Authentication → Providers**

2. **Enable Google OAuth**:
   - Toggle "Google" to enabled
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com):
     - Create OAuth 2.0 Client ID
     - Add authorized redirect URIs:
       ```
       https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
       http://localhost:3000/auth/callback (for development)
       ```
   - Copy Client ID and Client Secret to Supabase

3. **Enable Apple Sign In**:
   - Toggle "Apple" to enabled
   - Get credentials from [Apple Developer Portal](https://developer.apple.com):
     - Create a Services ID
     - Configure Sign in with Apple
     - Add your domain and redirect URLs
   - Copy Services ID, Team ID, Key ID, and Private Key to Supabase

### Step 2: Configure Redirect URLs

In Supabase dashboard → Authentication → URL Configuration:

**Site URL**:
```
http://localhost:3000
```
(Change to your production domain when deploying)

**Redirect URLs** (add both):
```
http://localhost:3000/auth/callback
https://YOUR_DOMAIN.com/auth/callback
```

### Step 3: Environment Variables

Ensure these are set in your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 📱 User Flow

### First-Time User:
```
1. Visit app → See "Sign In" button in header
2. Click "Sign In" → Redirected to /login
3. Choose "Continue with Google" or "Continue with Apple"
4. OAuth popup → User signs in with provider
5. Redirected to /auth/callback
6. Callback handler validates session
7. Redirected to / (home page)
8. User sees their name/avatar in header
```

### Returning User:
```
1. Visit app → Automatically signed in (persistent session)
2. See name/avatar in header
3. Can access protected features
```

### Sign Out:
```
1. Click user avatar in header
2. Click "Sign Out" in dropdown
3. Session cleared
4. Redirected to /login
5. Header shows "Sign In" button again
```

---

## 🎨 UI Components

### Login Page Features:
- Gradient background (purple to indigo)
- App logo and branding
- Large, prominent sign-in buttons
- Google button: white with Google colors
- Apple button: black with white text
- Loading spinners during OAuth
- Error messages display inline
- Feature list at bottom
- Terms and Privacy links

### User Menu Features:
- Avatar with first letter of name
- User's full name and email
- Dropdown with smooth animation
- Click outside to close
- Links to:
  - My Projects
  - Settings (placeholder)
  - Sign Out (red button)

---

## 🔒 Security Features

### Session Management:
- Sessions stored securely in Supabase
- Auto-refresh tokens
- Persistent sessions across page reloads
- Secure HttpOnly cookies

### OAuth Security:
- State parameter for CSRF protection
- Secure redirect validation
- Token exchange on server side
- No sensitive data in client

---

## 🚀 Protected Routes (Optional - Not Yet Implemented)

To add route protection, create `middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && req.nextUrl.pathname.startsWith('/projects')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/projects/:path*', '/project/:path*'],
};
```

---

## 🧪 Testing Authentication

### Test Google Login:
1. Start dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Sign In" button
4. Click "Continue with Google"
5. Sign in with Google account
6. Check that you're redirected back
7. Verify user menu shows your name

### Test Apple Login:
1. Same flow as above
2. Click "Continue with Apple"
3. Sign in with Apple ID
4. Verify redirect and user menu

### Test Sign Out:
1. Click user avatar
2. Click "Sign Out"
3. Verify you're signed out
4. Check header shows "Sign In" button

### Test Persistence:
1. Sign in
2. Refresh page
3. Verify you're still signed in
4. Close tab and reopen
5. Should still be signed in

---

## 📂 Files Created/Modified

### New Files:
- `lib/auth-context.tsx` - Auth provider and hook
- `app/login/page.tsx` - Login page
- `app/auth/callback/page.tsx` - OAuth callback handler
- `components/auth/UserMenu.tsx` - User dropdown menu

### Modified Files:
- `app/layout.tsx` - Added AuthProvider wrapper
- `app/page.tsx` - Added UserMenu to header
- `app/projects/page.tsx` - Added UserMenu to header
- `lib/supabase.ts` - Already had auth config

---

## 🎯 Next Steps (Optional Enhancements)

### 1. **User Profile Page**
Create `/app/profile/page.tsx`:
- Edit display name
- Upload profile picture
- Manage account settings

### 2. **Email/Password Auth**
Add traditional email/password login:
- Sign up form
- Email verification
- Password reset flow

### 3. **Social Metadata**
Store additional user data in Supabase:
- User preferences
- Onboarding completion
- Usage statistics

### 4. **Team Features**
Multi-user collaboration:
- Share projects with team members
- Role-based permissions
- Invite system

### 5. **Billing Integration**
Stripe/payment integration:
- Subscription tiers
- Usage limits
- Payment portal

---

## 🐛 Troubleshooting

### Issue: "Auth failed" error
**Solution**:
- Check Supabase redirect URLs are configured
- Verify OAuth credentials in Supabase dashboard
- Check browser console for specific errors

### Issue: Infinite redirect loop
**Solution**:
- Clear browser cookies/localStorage
- Check that callback page exists at `/auth/callback`
- Verify Supabase URL in environment variables

### Issue: "Sign In" button doesn't appear
**Solution**:
- Check that Supabase is configured (env variables)
- Verify AuthProvider is wrapping the app in layout.tsx
- Check browser console for errors

### Issue: OAuth popup blocked
**Solution**:
- Allow popups for your domain
- Try in different browser
- Check that OAuth is triggered by user click (not automatic)

---

## 📝 Environment Variables Checklist

```bash
# Required for Authentication
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co ✓
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key ✓

# Already configured (for other features)
GEMINI_API_KEY=your_gemini_key ✓
```

---

## ✅ Authentication is Ready!

The app now has:
- ✅ Google OAuth login
- ✅ Apple Sign In
- ✅ Beautiful login page
- ✅ User menu with avatar
- ✅ Persistent sessions
- ✅ Secure authentication
- ✅ Graceful error handling
- ✅ Mobile responsive

**Next**: Configure OAuth providers in Supabase dashboard to enable authentication!
