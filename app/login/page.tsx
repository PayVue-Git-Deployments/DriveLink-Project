'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message in login page:', event.data, 'from origin:', event.origin);
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data.session) {
          const supabase = createClient();
          supabase.auth.setSession(event.data.session).then(({ error }) => {
            if (error) console.error('Error setting session:', error);
            window.location.href = '/dashboard'
          }).catch((err) => {
            console.error('Exception setting session:', err);
            window.location.href = '/dashboard'
          });
        } else {
          window.location.href = '/dashboard'
        }
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setLoading(false)
        alert('Authentication failed. Please try again.')
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  const handleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      },
    })

    if (error) {
      console.error('Error logging in:', error.message)
      setLoading(false)
      return
    }

    if (data?.url) {
      const authWindow = window.open(
        data.url,
        'oauth_popup',
        'width=600,height=700'
      )

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to DriveLink
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your Google account to manage test drives
          </p>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  )
}
