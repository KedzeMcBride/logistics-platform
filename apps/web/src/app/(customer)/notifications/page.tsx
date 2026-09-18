'use client';

import { Bell, Check, CheckCheck } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonText } from '@/components/ui/skeleton';
import { type NotificationDto, useNotifications } from '@/features/notifications';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { items, isLoading, error, unreadCount, markRead, markAllRead, refetch } =
    useNotifications();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Notifications</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <NotificationSkeleton />
          <NotificationSkeleton />
          <NotificationSkeleton />
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 text-sm font-semibold text-red-900 underline"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Updates about your deliveries and account will show up here."
        />
      )}

      {!isLoading && !error && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={() => void markRead(notification.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: NotificationDto;
  onMarkRead: () => void;
}) {
  const isUnread = !notification.readAt;

  return (
    <li
      className={cn(
        'flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors',
        isUnread ? 'border-emerald-200' : 'border-neutral-200',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          isUnread ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500',
        )}
      >
        <Bell className="h-4 w-4" strokeWidth={2.25} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              'text-sm',
              isUnread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700',
            )}
          >
            {notification.title}
          </p>
          <time className="shrink-0 text-xs text-neutral-400">
            {formatRelative(notification.createdAt)}
          </time>
        </div>
        <p className="mt-1 text-sm text-neutral-500">{notification.body}</p>
      </div>

      {isUnread && (
        <button
          type="button"
          onClick={onMarkRead}
          title="Mark as read"
          className="shrink-0 rounded-lg border border-neutral-200 p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

function NotificationSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex gap-4">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-neutral-200" />
        <div className="flex-1">
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
