'use client';

import { usePathname } from 'next/navigation';
import { LogOut, Package } from 'lucide-react';

import { useAuth } from '@/features/auth/use-auth';
import { cn } from '@/lib/utils';

function getPageTitle(pathname: string): string {
  if (
    pathname === '/dashboard' ||
    pathname === '/customer/dashboard' ||
    pathname === '/driver/dashboard' ||
    pathname === '/admin'
  ) {
    return 'Dashboard';
  }

  if (pathname.startsWith('/deliveries') || pathname.startsWith('/customer/deliveries')) {
    return 'Deliveries';
  }

  if (pathname.startsWith('/driver/vehicles')) {
    return 'Vehicles';
  }

  if (pathname.startsWith('/driver/documents')) {
    return 'Documents';
  }

  if (
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/customer/notifications') ||
    pathname.startsWith('/driver/notifications')
  ) {
    return 'Notifications';
  }

  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/customer/profile') ||
    pathname.startsWith('/driver/profile')
  ) {
    return 'Profile';
  }

  if (pathname.startsWith('/admin/drivers')) {
    return 'Drivers';
  }

  return 'Portway';
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-20 items-center justify-between',
        'border-b border-white/60',
        'bg-white/70 backdrop-blur-xl',
        'shadow-[0_4px_24px_rgba(0,0,0,0.04)]',
        'px-4 sm:px-6 lg:px-8',
      )}
    >
      {/* Page title */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center',
            'rounded-2xl',
            'bg-emerald-600 text-white',
            'shadow-[0_6px_18px_rgba(5,150,105,0.20)]',
            'transition-transform duration-200',
            'hover:scale-105',
          )}
        >
          <Package className="h-5 w-5" strokeWidth={2.2} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
            Portway
          </p>

          <h1 className="text-lg font-bold tracking-tight text-neutral-900">{pageTitle}</h1>
        </div>
      </div>

      {/* User controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User profile */}
        <div
          className={cn(
            'hidden items-center gap-3 sm:flex',
            'rounded-2xl border border-white/70',
            'bg-white/60 px-3 py-2',
            'backdrop-blur-md',
            'transition-all duration-200',
            'hover:bg-white/80',
            'hover:shadow-[0_4px_14px_rgba(0,0,0,0.04)]',
          )}
        >
          {/* Avatar */}
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center',
              'rounded-xl',
              'bg-emerald-50',
              'text-sm font-bold text-emerald-700',
            )}
          >
            {(user?.fullName ?? user?.email ?? 'U').charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 text-right">
            <p className="max-w-[180px] truncate text-sm font-semibold text-neutral-900">
              {user?.fullName ?? user?.email}
            </p>

            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className={cn(
            'group flex items-center gap-2',
            'rounded-2xl border border-white/70',
            'bg-white/60 px-3 py-2.5',
            'text-sm font-medium text-neutral-600',
            'backdrop-blur-md',
            'transition-all duration-200 ease-out',
            'hover:-translate-y-[1px]',
            'hover:bg-white/90',
            'hover:text-red-600',
            'hover:shadow-[0_4px_14px_rgba(0,0,0,0.05)]',
            'focus:outline-none focus-visible:ring-2',
            'focus-visible:ring-emerald-500/50',
          )}
        >
          <LogOut
            className={cn(
              'h-[18px] w-[18px]',
              'transition-transform duration-200',
              'group-hover:translate-x-0.5',
            )}
          />

          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
