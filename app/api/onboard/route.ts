import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!settings || !settings.google_access_token) {
    return NextResponse.json({ error: 'Google tokens not found' }, { status: 400 })
  }

  if (settings.sheet_id) {
    return NextResponse.json({ message: 'Already onboarded', sheet_id: settings.sheet_id })
  }

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: settings.google_access_token,
      refresh_token: settings.google_refresh_token,
    })

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'DriveLink Leads',
        },
      },
    })

    const sheetId = spreadsheet.data.spreadsheetId

    if (!sheetId) {
      throw new Error('Failed to create spreadsheet')
    }

    // Add header row
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1:F1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Name', 'Phone', 'Email', 'Vehicle', 'Booking Time', 'Status']],
      },
    })

    // Update settings
    await supabase
      .from('user_settings')
      .update({ sheet_id: sheetId })
      .eq('id', user.id)

    return NextResponse.json({ message: 'Onboarding complete', sheet_id: sheetId })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
