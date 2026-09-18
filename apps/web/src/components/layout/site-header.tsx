'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';

import { useAuth } from '@/features/auth/use-auth';

export function SiteHeader() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-bold text-neutral-900"
        >
          <Package className="h-5 w-5 text-emerald-800" strokeWidth={2.5} />
          <span>Portway</span>
        </Link>

        {!isLoading && isAuthenticated && (
          <nav className="flex items-center gap-6 text-[15px]">
            <Link href="/dashboard" className="font-medium text-neutral-700 hover:text-neutral-900">
              Dashboard
            </Link>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-500">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Log out
            </button>
          </nav>
        )}

        {!isLoading && !isAuthenticated && (
          <nav className="flex items-center gap-4 text-[15px]">
            <Link href="/login" className="font-medium text-neutral-700 hover:text-neutral-900">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
