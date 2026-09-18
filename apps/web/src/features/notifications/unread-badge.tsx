'use client';

import { useNotifications } from './use-notifications';

export function UnreadBadge() {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-800 px-1.5 text-[11px] font-semibold text-white">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
