'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfDay, isBefore, isSameDay } from 'date-fns'

export default function BookingForm({ profileId }: { profileId: string }) {
  const [date, setDate] = useState<Date>(new Date())
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Fetch vehicle from URL query params
    const params = new URLSearchParams(window.location.search)
    const v = params.get('vehicle')
    if (v) setVehicle(v)
  }, [])

  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true)
      try {
        const res = await fetch(`/api/availability?profileId=${profileId}&date=${date.toISOString()}`)
        if (res.ok) {
          const data = await res.json()
          setSlots(data.slots)
        }
      } catch (error) {
        console.error('Error fetching slots:', error)
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [date, profileId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          name,
          phone,
          email,
          vehicle,
          startTime: selectedSlot,
        }),
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to book')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('An error occurred while booking.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <h3 className="text-2xl font-bold text-green-600">You&apos;re booked ✅</h3>
        <p className="mt-2 text-gray-600">We&apos;ve sent you a confirmation message.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Select Date</label>
        <div className="mt-2 flex space-x-2 overflow-x-auto pb-2">
          {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
            const d = addDays(new Date(), offset)
            const isSelected = isSameDay(d, date)
            return (
              <button
                key={offset}
                type="button"
                onClick={() => {
                  setDate(d)
                  setSelectedSlot(null)
                }}
                className={`flex-shrink-0 rounded-md px-4 py-2 text-sm font-medium ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {format(d, 'EEE, MMM d')}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Select Time</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {loadingSlots ? (
            <div className="col-span-3 text-center text-sm text-gray-500">Loading times...</div>
          ) : slots.length === 0 ? (
            <div className="col-span-3 text-center text-sm text-gray-500">No times available</div>
          ) : (
            slots.map((slot) => {
              const isSelected = selectedSlot === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {format(new Date(slot), 'h:mm a')}
                </button>
              )
            })
          )}
        </div>
      </div>

      {selectedSlot && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Vehicle of Interest</label>
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      )}
    </form>
  )
}
