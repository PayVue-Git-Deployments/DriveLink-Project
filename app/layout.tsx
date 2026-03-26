import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PayVue BOS',
  description: 'Business Operating System for African SME Tourism',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body suppressHydrationWarning className="bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
