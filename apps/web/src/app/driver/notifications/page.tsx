'use client';

import { useState } from 'react';
import { Bell, CheckCheck, CircleAlert, FileText, Info, Loader2, Truck } from 'lucide-react';

import { useNotifications, type NotificationDto } from '@/features/notifications';

export default function DriverNotificationsPage() {
  const { items, isLoading, error, unreadCount, refetch, markRead, markAllRead } =
    useNotifications();

  const [actionError, setActionError] = useState<string | null>(null);

  const handleMarkRead = async (notification: NotificationDto) => {
    if (notification.readAt) return;

    try {
      setActionError(null);
      await markRead(notification.id);
    } catch {
      setActionError('Unable to mark notification as read. Please try again.');
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    try {
      setActionError(null);
      await markAllRead();
    } catch {
      setActionError('Unable to mark all notifications as read. Please try again.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Bell className="h-5 w-5 text-emerald-800" strokeWidth={2} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Stay up to date with your deliveries and driver activity.
              </p>
            </div>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {actionError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {error && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Unable to load notifications</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      )}

      {!error && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-neutral-900">Recent notifications</h2>
              <p className="mt-1 text-xs text-neutral-500">
                {unreadCount === 0
                  ? 'You are all caught up.'
                  : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
              </p>
            </div>

            <Bell className="h-5 w-5 text-neutral-400" />
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading notifications...
              </div>
            </div>
          ) : items.length === 0 ? (
            <EmptyNotifications />
          ) : (
            <div className="divide-y divide-neutral-100">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={() => void handleMarkRead(notification)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: NotificationDto;
  onMarkRead: () => void;
}) {
  const isUnread = !notification.readAt;

  return (
    <div
      className={`flex gap-4 px-5 py-5 transition-colors ${
        isUnread ? 'bg-emerald-50/40' : 'bg-white'
      }`}
    >
      <div
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isUnread ? 'bg-emerald-100' : 'bg-neutral-100'
        }`}
      >
        <NotificationIcon type={notification.type} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm ${
                  isUnread ? 'font-bold text-neutral-900' : 'font-semibold text-neutral-700'
                }`}
              >
                {notification.title}
              </h3>

              {isUnread && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
            </div>

            <p className="mt-1 text-sm leading-6 text-neutral-600">{notification.body}</p>
          </div>

          <time dateTime={notification.createdAt} className="shrink-0 text-xs text-neutral-400">
            {formatNotificationDate(notification.createdAt)}
          </time>
        </div>

        {isUnread && (
          <button
            type="button"
            onClick={onMarkRead}
            className="mt-3 text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  const normalizedType = type.toLowerCase();

  if (
    normalizedType.includes('vehicle') ||
    normalizedType.includes('delivery') ||
    normalizedType.includes('trip')
  ) {
    return <Truck className="h-5 w-5 text-emerald-800" />;
  }

  if (normalizedType.includes('document') || normalizedType.includes('approval')) {
    return <FileText className="h-5 w-5 text-emerald-800" />;
  }

  if (normalizedType.includes('alert') || normalizedType.includes('warning')) {
    return <CircleAlert className="h-5 w-5 text-amber-600" />;
  }

  return <Info className="h-5 w-5 text-emerald-800" />;
}

function EmptyNotifications() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
        <Bell className="h-7 w-7 text-neutral-400" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-neutral-900">No notifications yet</h3>

      <p className="mt-1 max-w-sm text-sm text-neutral-500">
        When there is an update about your driver account, vehicles, documents, or deliveries, it
        will appear here.
      </p>
    </div>
  );
}

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
