'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LayoutDashboard, Package, User, type LucideIcon } from 'lucide-react';

import { UnreadBadge } from '@/features/notifications';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  showBadge?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/deliveries', label: 'Deliveries', icon: Package },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
  { href: '/profile', label: 'Profile', icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white md:block">
      <nav className="sticky top-0 flex h-screen flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
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
