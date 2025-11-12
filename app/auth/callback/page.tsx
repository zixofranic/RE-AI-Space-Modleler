'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there's a hash fragment with tokens (OAuth implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session from the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            router.replace('/login?error=auth_failed');
            return;
          }

          // Successfully authenticated - redirect to home with clean URL
          router.replace('/');
          return;
        }

        // Fallback: try to get existing session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error during auth callback:', error);
          router.replace('/login?error=auth_failed');
          return;
        }

        if (session) {
          // Successfully authenticated - redirect to home
          router.replace('/');
        } else {
          // No session - redirect to login
          router.replace('/login');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        router.replace('/login?error=auth_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we redirect you</p>
      </div>
    </div>
  );
}
