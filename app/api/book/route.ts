import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getGoogleAuth } from '@/lib/google/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/twilio'
import { format, addHours } from 'date-fns'

export async function POST(request: Request) {
  const body = await request.json()
  const { profileId, name, phone, email, vehicle, startTime } = body

  if (!profileId || !name || !phone || !startTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', profileId)
    .single()

  if (!profile || !settings) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  try {
    const auth = await getGoogleAuth(profileId)
    const calendar = google.calendar({ version: 'v3', auth })
    const sheets = google.sheets({ version: 'v4', auth })
    const gmail = google.gmail({ version: 'v1', auth })

    const startDateTime = new Date(startTime)
    const endDateTime = addHours(startDateTime, 1)

    // 1. Create Calendar Event
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Test Drive - ${name}`,
        description: `Phone: ${phone}\nEmail: ${email || 'N/A'}\nVehicle: ${vehicle || 'N/A'}`,
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
        attendees: email ? [{ email }] : [],
      },
    })

    // 2. Append to Google Sheet
    if (settings.sheet_id) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: settings.sheet_id,
        range: 'Sheet1!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              name,
              phone,
              email || '',
              vehicle || '',
              format(startDateTime, 'yyyy-MM-dd HH:mm'),
              'Booked',
            ],
          ],
        },
      })
    }

    // 3. Send Email via Gmail API (if email provided)
    if (email) {
      const subject = 'Test Drive Confirmation'
      const messageText = `Hi ${name},\n\nYour test drive is confirmed for ${format(startDateTime, 'EEEE, MMMM do, yyyy h:mm a')}.\n\nVehicle: ${vehicle || 'TBD'}\nRep: ${profile.name}\n\nSee you then!`
      
      const emailLines = [
        `To: ${email}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        messageText,
      ]
      const emailBody = emailLines.join('\r\n')
      const encodedEmail = Buffer.from(emailBody)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      })
    }

    // 4. Send SMS via Twilio
    const smsMessage = `Hi ${name}, you're booked for a test drive on ${format(startDateTime, 'MMM d, h:mm a')}. Reply if you need to reschedule.`
    await sendSMS(phone, smsMessage)

    // Note: Reminders (24h/2h) would be scheduled here using a background job queue
    // like Supabase Edge Functions + pg_cron, or a service like Inngest/Upstash.
    // For MVP, we'll skip the actual scheduling infrastructure.

    return NextResponse.json({ success: true, eventId: event.data.id })
  } catch (error: any) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
