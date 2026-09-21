'use client';

import Link from 'next/link';
import { Package, Plus } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { DeliveryStatusBadge, useDeliveries } from '@/features/deliveries';
import { formatFCFA } from '@/lib/currency';

export default function DeliveriesPage() {
  const { items, isLoading, error, refetch } = useDeliveries();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Deliveries</h2>
          <p className="mt-1 text-sm text-neutral-500">All your deliveries, active and past.</p>
        </div>
        <Link
          href="/customer/deliveries/new"
          className="flex items-center gap-2 rounded-lg bg-[#488aec] -800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgba(72,138,236,0.31),0_4px_6px_-2px_rgba(72,138,236,0.09)] focus:outline-none focus:ring-2 focus:ring-[#488aec]/40 focus:ring-offset-2 active:translate-y-0 active:opacity-85 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          New delivery
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
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
          icon={Package}
          title="No deliveries yet"
          description="Create your first delivery to see it tracked here in real time."
          action={
            <Link
              href="/deliveries/new"
              className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              Create delivery
            </Link>
          }
        />
      )}

      {!isLoading && !error && items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((delivery) => (
            <li key={delivery.id}>
              <Link
                href={`/deliveries/${delivery.id}`}
                className="block rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-emerald-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <DeliveryStatusBadge status={delivery.status} />
                  <span className="text-xs text-neutral-400">
                    {formatRelative(delivery.createdAt)}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <AddressRow label="From" value={delivery.pickupAddress} />
                  <AddressRow label="To" value={delivery.destinationAddress} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                  <div className="text-xs text-neutral-500">
                    {delivery.packageSizeCategory} · {delivery.packageWeightKg} kg ·{' '}
                    {delivery.priority}
                  </div>
                  <div className="text-sm font-bold text-neutral-900">
                    {formatFCFA(delivery.estimatedPrice)}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddressRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-10 shrink-0 text-xs font-medium uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      <span className="text-sm text-neutral-700">{value}</span>
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
