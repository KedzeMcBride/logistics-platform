import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/features/auth';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Logistics Platform',
  description:
    'Real-time logistics and delivery management with live tracking, driver dispatch, and admin operations.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
