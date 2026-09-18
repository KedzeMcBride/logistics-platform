'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { apiClient } from '@/lib/api-client';

export type NotificationDto = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channel: string;
  status: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  items: NotificationDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const POLL_INTERVAL_MS = 30_000;

export function useNotifications(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const mountedRef = useRef(true);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [list, count] = await Promise.all([
        apiClient.get<NotificationsResponse>('/notifications?limit=50', { auth: true }),
        apiClient.get<{ count: number }>('/notifications/unread-count', { auth: true }),
      ]);
      if (!mountedRef.current) return;
      setItems(list.items);
      setUnreadCount(count.count);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      if (mountedRef.current && !silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    void fetchAll();
    const interval = setInterval(() => void fetchAll(true), POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [enabled, fetchAll]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiClient.patch(`/notifications/${id}/read`, undefined, { auth: true });
    } catch (err) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)));
      setUnreadCount((prev) => prev + 1);
      throw err;
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const previousItems = items;
    const previousCount = unreadCount;

    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);

    try {
      await apiClient.patch('/notifications/read-all', undefined, { auth: true });
    } catch (err) {
      setItems(previousItems);
      setUnreadCount(previousCount);
      throw err;
    }
  }, [items, unreadCount]);

  return {
    items,
    isLoading,
    error,
    unreadCount,
    refetch: () => fetchAll(false),
    markRead,
    markAllRead,
  };
}
