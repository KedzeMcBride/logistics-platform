'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Package, MapPin, User, Phone, Scale } from 'lucide-react';

import { DeliveryStatusBadge } from '@/features/deliveries';
import { cancelDelivery, confirmDelivery, useDelivery } from '@/features/deliveries/use-deliveries';
import { formatFCFA } from '@/lib/currency';
import { cn } from '@/lib/utils';

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { delivery, isLoading, error, refetch } = useDelivery(id);

  async function handleConfirm() {
    if (!delivery) return;
    try {
      await confirmDelivery(delivery.id);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm');
    }
  }

  async function handleCancel() {
    if (!delivery) return;
    const reason = window.prompt('Reason for cancellation?') ?? undefined;
    try {
      await cancelDelivery(delivery.id, reason);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-neutral-500">Loading delivery...</p>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error ?? 'Delivery not found'}</p>
          <Link
            href="/deliveries"
            className="mt-3 inline-block text-sm font-semibold text-red-900 underline"
          >
            Back to deliveries
          </Link>
        </div>
      </div>
    );
  }

  const canConfirm = delivery.status === 'PENDING';
  const canCancel = ['PENDING', 'CONFIRMED', 'SEARCHING_FOR_DRIVER'].includes(delivery.status);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/deliveries"
        className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to deliveries
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <DeliveryStatusBadge status={delivery.status} />
            <span className="text-xs text-neutral-400">#{delivery.id.slice(0, 8)}</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold text-neutral-900">
            {delivery.pickupAddress.split(',')[0]} → {delivery.destinationAddress.split(',')[0]}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Created {new Date(delivery.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      {(canConfirm || canCancel) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {canConfirm && (
            <button
              type="button"
              onClick={() => void handleConfirm()}
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              Confirm delivery
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => void handleCancel()}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Cancel delivery
            </button>
          )}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Route card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Route
          </h3>
          <div className="space-y-4">
            <RouteRow
              icon={Package}
              label="Pickup"
              address={delivery.pickupAddress}
              extra={`${delivery.pickupLat.toFixed(4)}, ${delivery.pickupLng.toFixed(4)}`}
            />
            <RouteRow
              icon={MapPin}
              label="Destination"
              address={delivery.destinationAddress}
              extra={`${delivery.destinationLat.toFixed(4)}, ${delivery.destinationLng.toFixed(4)}`}
            />
          </div>
        </div>

        {/* Package card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Package
          </h3>
          <dl className="space-y-3 text-sm">
            <InfoRow label="Description" value={delivery.packageDescription} />
            <InfoRow label="Size" value={delivery.packageSizeCategory} />
            <InfoRow label="Weight" value={`${delivery.packageWeightKg} kg`} icon={Scale} />
            <InfoRow label="Priority" value={delivery.priority} />
          </dl>
        </div>

        {/* Recipient card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Recipient
          </h3>
          <dl className="space-y-3 text-sm">
            <InfoRow label="Name" value={delivery.recipientName} icon={User} />
            <InfoRow label="Phone" value={delivery.recipientPhone} icon={Phone} />
            {delivery.notes && <InfoRow label="Notes" value={delivery.notes} />}
          </dl>
        </div>

        {/* Pricing card */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-emerald-800">
                Estimated price
              </h3>
              <p className="mt-1 text-xs text-emerald-700">
                {delivery.estimatedDistanceKm} km · {delivery.estimatedDurationMin} min
              </p>
            </div>
            <span className="text-3xl font-bold text-emerald-900">
              {formatFCFA(delivery.estimatedPrice)}
            </span>
          </div>
        </div>

        {/* Status timeline */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Status history
          </h3>
          {delivery.statusHistory && delivery.statusHistory.length > 0 ? (
            <ol className="relative space-y-4 border-l border-neutral-200 pl-6">
              {delivery.statusHistory.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-800" />
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-neutral-900">
                      {entry.toStatus.replace(/_/g, ' ')}
                    </span>
                    <time className="shrink-0 text-xs text-neutral-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </time>
                  </div>
                  {entry.reason && (
                    <p className="mt-0.5 text-xs text-neutral-500">{entry.reason}</p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-neutral-500">No status history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RouteRow({
  icon: Icon,
  label,
  address,
  extra,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  address: string;
  extra?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="h-4 w-4 text-neutral-500" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-neutral-900">{address}</p>
        {extra && <p className="text-xs text-neutral-400">{extra}</p>}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-neutral-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className={cn('text-right text-neutral-900')}>{value}</dd>
    </div>
  );
}
