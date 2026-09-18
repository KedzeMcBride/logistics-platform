'use client';

import { Package } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

export default function DeliveriesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Deliveries</h2>
        <p className="mt-1 text-sm text-neutral-500">All your deliveries, active and past.</p>
      </div>

      <EmptyState
        icon={Package}
        title="No deliveries yet"
        description="Once you create a delivery, it will appear here with live tracking."
      />
    </div>
  );
}
