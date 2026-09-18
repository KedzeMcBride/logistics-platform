'use client';

import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { useAuth } from '@/features/auth/use-auth';
import { cn } from '@/lib/utils';

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/deliveries')) return 'Deliveries';
  if (pathname.startsWith('/notifications')) return 'Notifications';
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'Portway';
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-neutral-900">{getPageTitle(pathname)}</h1>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-neutral-900">{user?.fullName ?? user?.email}</p>
          <p className="text-xs text-neutral-500">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5',
            'text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50',
          )}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
