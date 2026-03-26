import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TransactionDashboard } from '@/components/TransactionDashboard';

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: merchantUser } = await supabase
    .from('merchant_users')
    .select('merchant_id')
    .eq('user_id', user.id)
    .single();

  if (!merchantUser) {
    return <div>Error loading merchant details.</div>;
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('merchant_id', merchantUser.merchant_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return <div>Error loading transactions.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">All Transactions</h1>
        <p className="text-zinc-500 mt-1">Detailed view of all your payments.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <TransactionDashboard initialData={transactions || []} />
      </div>
    </div>
  );
}
