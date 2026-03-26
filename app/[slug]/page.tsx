import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BookingForm from './BookingForm'

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!profile) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Book a Test Drive with {profile.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Select a time that works for you.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <BookingForm profileId={profile.id} />
        </div>
      </div>
    </div>
  )
}
