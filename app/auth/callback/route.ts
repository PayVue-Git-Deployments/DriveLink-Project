import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('OAuth exchange error:', error)
    }

    if (!error && data.session) {
      // Store Google tokens in the profiles table
      const { provider_token, provider_refresh_token } = data.session
      
      if (provider_token && provider_refresh_token) {
        const expiryDate = new Date()
        expiryDate.setHours(expiryDate.getHours() + 1) // Google tokens typically expire in 1 hour

        await supabase
          .from('user_settings')
          .update({
            google_access_token: provider_token,
            google_refresh_token: provider_refresh_token,
            google_expiry: expiryDate.toISOString(),
          })
          .eq('id', data.session.user.id)
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalhost = process.env.NODE_ENV === 'development'
      
      const htmlResponse = `
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS',
                  session: ${JSON.stringify(data.session)}
                }, '*');
                window.close();
              } else {
                window.location.href = '${next}';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `
      
      return new NextResponse(htmlResponse, {
        headers: { 'Content-Type': 'text/html' },
      })
    }
  }

  // return the user to an error page with instructions
  const errorHtml = `
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR' }, '*');
            window.close();
          } else {
            window.location.href = '/login?error=Could not authenticate user';
          }
        </script>
        <p>Authentication failed. This window should close automatically.</p>
      </body>
    </html>
  `
  return new NextResponse(errorHtml, {
    headers: { 'Content-Type': 'text/html' },
  })
}
