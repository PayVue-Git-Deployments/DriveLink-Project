import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // If no profile, maybe they need to onboard
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Welcome to DriveLink</h1>
        <p>Please complete your profile setup.</p>
        <form action="/api/onboard" method="POST">
          <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
            Complete Setup
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Welcome back, {profile.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Your Booking Link</h3>
          <p className="text-lg font-bold text-blue-600 mt-2">
            <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
              drivelink.app/{profile.slug}
            </a>
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Google Sheet</h3>
          <p className="text-sm text-zinc-900 mt-2">
            {settings?.sheet_id ? (
              <a href={`https://docs.google.com/spreadsheets/d/${settings.sheet_id}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                View Leads Sheet
              </a>
            ) : (
              'Not connected'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
