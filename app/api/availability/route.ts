import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getGoogleAuth } from '@/lib/google/auth'
import { startOfDay, endOfDay, addHours, isBefore, parseISO, formatISO } from 'date-fns'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('profileId')
  const dateStr = searchParams.get('date')

  if (!profileId || !dateStr) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const auth = await getGoogleAuth(profileId)
    const calendar = google.calendar({ version: 'v3', auth })

    const targetDate = new Date(dateStr)
    const timeMin = startOfDay(targetDate)
    const timeMax = endOfDay(targetDate)

    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: 'primary' }],
      },
    })

    const busySlots = res.data.calendars?.primary?.busy || []

    // Generate 60-minute slots from 9 AM to 5 PM
    const slots: string[] = []
    let currentSlot = new Date(timeMin)
    currentSlot.setHours(9, 0, 0, 0)
    const endOfDayTime = new Date(timeMin)
    endOfDayTime.setHours(17, 0, 0, 0)

    const now = new Date()

    while (isBefore(currentSlot, endOfDayTime)) {
      const slotEnd = addHours(currentSlot, 1)

      // Check if slot is in the past
      if (isBefore(currentSlot, now)) {
        currentSlot = slotEnd
        continue
      }

      // Check if slot overlaps with busy times
      const isBusy = busySlots.some((busy) => {
        if (!busy.start || !busy.end) return false
        const busyStart = new Date(busy.start)
        const busyEnd = new Date(busy.end)
        return (
          (currentSlot >= busyStart && currentSlot < busyEnd) ||
          (slotEnd > busyStart && slotEnd <= busyEnd) ||
          (currentSlot <= busyStart && slotEnd >= busyEnd)
        )
      })

      if (!isBusy) {
        slots.push(currentSlot.toISOString())
      }

      currentSlot = slotEnd
    }

    return NextResponse.json({ slots })
  } catch (error: any) {
    console.error('Availability error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
