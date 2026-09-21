import type { Metadata } from 'next';

import { AuthProvider } from '@/features/auth';

import './globals.css';

export const metadata: Metadata = {
  title: 'Logistics Platform',
  description:
    'Real-time logistics and delivery management with live tracking, driver dispatch, and admin operations.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
