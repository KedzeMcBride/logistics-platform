'use client';

import { Bell } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Notifications</h2>
        <p className="mt-1 text-sm text-neutral-500">Updates about your deliveries and account.</p>
      </div>

      <EmptyState
        icon={Bell}
        title="You're all caught up"
        description="Notifications about your deliveries will show up here."
      />
    </div>
  );
}
