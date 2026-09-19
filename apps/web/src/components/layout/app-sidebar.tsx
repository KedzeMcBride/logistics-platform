'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Car,
  FileText,
  LayoutDashboard,
  Package,
  User,
  type LucideIcon,
} from 'lucide-react';

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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/deliveries', label: 'Deliveries', icon: Package },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
  { href: '/profile', label: 'Profile', icon: User },
];

const DRIVER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vehicles', label: 'Vehicles', icon: Car },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
  { href: '/profile', label: 'Profile', icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/drivers', label: 'Drivers', icon: Car },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items =
    user?.role === 'DRIVER' ? DRIVER_NAV : user?.role === 'ADMIN' || user?.role === 'OPERATIONS_MANAGER' ? ADMIN_NAV : CUSTOMER_NAV;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white md:block">
      <nav className="sticky top-0 flex h-screen flex-col gap-1 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              <Icon
                className={cn('h-5 w-5', isActive ? 'text-emerald-800' : 'text-neutral-500')}
                strokeWidth={isActive ? 2.25 : 2}
              />
              <span>{item.label}</span>
              {item.showBadge && <UnreadBadge />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}