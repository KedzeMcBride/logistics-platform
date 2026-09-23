'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Car, FileText, LayoutDashboard, Package, User, type LucideIcon } from 'lucide-react';

import { useAuth } from '@/features/auth/use-auth';
import { UnreadBadge } from '@/features/notifications';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  showBadge?: boolean;
};

const CUSTOMER_NAV: NavItem[] = [
  { href: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customer/deliveries', label: 'Deliveries', icon: Package },
  {
    href: '/customer/notifications',
    label: 'Notifications',
    icon: Bell,
    showBadge: true,
  },
  { href: '/customer/profile', label: 'Profile', icon: User },
];

const DRIVER_NAV: NavItem[] = [
  { href: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/driver/vehicles', label: 'Vehicles', icon: Car },
  { href: '/driver/documents', label: 'Documents', icon: FileText },
  {
    href: '/driver/notifications',
    label: 'Notifications',
    icon: Bell,
    showBadge: true,
  },
  { href: '/driver/profile', label: 'Profile', icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/drivers', label: 'Drivers', icon: Car },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: Bell,
    showBadge: true,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items =
    user?.role === 'DRIVER'
      ? DRIVER_NAV
      : user?.role === 'ADMIN' || user?.role === 'OPERATIONS_MANAGER'
        ? ADMIN_NAV
        : CUSTOMER_NAV;

  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <nav
        className={cn(
          'sticky top-0 flex h-screen flex-col',
          'border-r border-white/60',
          'bg-white/70 backdrop-blur-xl',
          'shadow-[4px_0_24px_rgba(0,0,0,0.04)]',
          'overflow-hidden',
        )}
      >
        <div className="px-5 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl',
                'bg-emerald-600 text-white',
                'shadow-[0_6px_18px_rgba(5,150,105,0.25)]',
              )}
            >
              <Package className="h-5 w-5" strokeWidth={2.2} />
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight text-neutral-900">Logistics</p>

              <p className="text-xs text-neutral-500">
                {user?.role === 'DRIVER'
                  ? 'Driver portal'
                  : user?.role === 'ADMIN' || user?.role === 'OPERATIONS_MANAGER'
                    ? 'Operations'
                    : 'Customer portal'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
            Navigation
          </p>

          <div className="space-y-1.5">
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 overflow-hidden',
                    'rounded-2xl px-3 py-3',
                    'text-sm font-medium',
                    'transition-all duration-200 ease-out',
                    'focus:outline-none focus-visible:ring-2',
                    'focus-visible:ring-emerald-500/50',

                    isActive
                      ? [
                          'bg-emerald-50/90 text-emerald-900',
                          'shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_16px_rgba(16,185,129,0.08)]',
                        ]
                      : [
                          'text-neutral-600',
                          'hover:-translate-y-[1px]',
                          'hover:bg-white/80',
                          'hover:text-neutral-900',
                          'hover:shadow-[0_4px_14px_rgba(0,0,0,0.04)]',
                        ],
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-7 w-1',
                      '-translate-y-1/2 rounded-r-full',
                      'bg-emerald-600',
                      'transition-all duration-300',
                      isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0',
                    )}
                  />

                  <span
                    className={cn(
                      'relative flex h-9 w-9 shrink-0 items-center justify-center',
                      'rounded-xl',
                      'transition-all duration-200 ease-out',

                      isActive
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : [
                            'text-neutral-500',
                            'group-hover:scale-105',
                            'group-hover:bg-neutral-100',
                            'group-hover:text-neutral-800',
                          ],
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.4 : 2} />
                  </span>

                  <span
                    className={cn(
                      'flex-1 truncate',
                      'transition-transform duration-200',
                      'group-hover:translate-x-0.5',
                    )}
                  >
                    {item.label}
                  </span>

                  {item.showBadge && (
                    <span className="shrink-0">
                      <UnreadBadge />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-3">
          <div
            className={cn(
              'rounded-2xl border border-white/70',
              'bg-white/60 px-3 py-3',
              'backdrop-blur-md',
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>

              <div>
                <p className="text-xs font-semibold text-neutral-800">System online</p>

                <p className="text-[10px] text-neutral-500">Everything is running normally</p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
