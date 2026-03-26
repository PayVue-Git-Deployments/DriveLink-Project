import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getGoogleAuth(profileId: string) {
  const supabase = createAdminClient()
  
  const { data: settings } = await supabase
    .from('user_settings')
    .select('google_access_token, google_refresh_token, google_expiry')
    .eq('id', profileId)
    .single()

  if (!settings || !settings.google_access_token) {
    throw new Error('Google tokens not found')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/auth/callback`
  )

  oauth2Client.setCredentials({
    access_token: settings.google_access_token,
    refresh_token: settings.google_refresh_token,
    expiry_date: new Date(settings.google_expiry).getTime(),
  })

  // Listen for token updates
  oauth2Client.on('tokens', async (tokens) => {
    const updates: any = {}
    if (tokens.access_token) {
      updates.google_access_token = tokens.access_token
    }
    if (tokens.refresh_token) {
      updates.google_refresh_token = tokens.refresh_token
    }
    if (tokens.expiry_date) {
      updates.google_expiry = new Date(tokens.expiry_date).toISOString()
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('user_settings')
        .update(updates)
        .eq('id', profileId)
    }
  })

  return oauth2Client
}
