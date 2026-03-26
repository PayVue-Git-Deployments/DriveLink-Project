import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogOut, LayoutDashboard, CreditCard, Settings, Package } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get merchant details
  const { data: merchantUser } = await supabase
    .from('merchant_users')
    .select('merchants(name, slug)')
    .eq('user_id', user.id)
    .single();

  const merchantName = merchantUser?.merchants?.name || 'Your Merchant';

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-zinc-300 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white tracking-tight">PayVue</h1>
          <p className="text-xs text-zinc-500 mt-1 truncate">{merchantName}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-800 text-white">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-medium">Transactions</span>
          </Link>
          <Link href="/dashboard/assets" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">Assets</span>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
