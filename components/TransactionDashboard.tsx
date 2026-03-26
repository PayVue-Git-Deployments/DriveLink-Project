'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  customer_name: string;
  created_at: string;
}

export function TransactionDashboard({ initialData }: { initialData: Transaction[] }) {
  const [transactions] = useState<Transaction[]>(initialData);

  // Group data by date for the chart
  const chartData = useMemo(() => {
    const grouped = transactions.reduce((acc, curr) => {
      const date = new Date(curr.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, amount: 0 };
      }
      if (curr.status === 'successful') {
        acc[date].amount += curr.amount;
      }
      return acc;
    }, {} as Record<string, { date: string; amount: number }>);

    return Object.values(grouped).reverse(); // Oldest to newest
  }, [transactions]);

  return (
    <div className="space-y-8">
      {/* Chart Section */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: 'none', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="amount" stroke="#18181b" strokeWidth={2} dot={{ r: 4, fill: '#18181b' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Provider</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-zinc-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                    {tx.customer_name || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                    ${tx.amount.toFixed(2)} {tx.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${tx.status === 'successful' ? 'bg-green-100 text-green-800' : 
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 capitalize">
                    {tx.provider}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
