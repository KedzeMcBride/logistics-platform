'use client';

import { CheckCircle2, CircleAlert, Clock3, FileText, MapPin, Power, Truck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { DriverAvailability } from '@repo/shared';

import { useDriverProfile } from '@/features/drivers';
import { cn } from '@/lib/utils';

export default function DriverDashboardPage() {
  const { driver, isLoading, error, refetch, setAvailability } = useDriverProfile();

  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  async function handleAvailabilityChange(availability: DriverAvailability) {
    if (!driver || isUpdatingAvailability) return;

    setIsUpdatingAvailability(true);
    setAvailabilityError(null);

    try {
      await setAvailability(availability);
    } catch (err) {
      setAvailabilityError(
        err instanceof Error ? err.message : 'Unable to update your availability.',
      );
    } finally {
      setIsUpdatingAvailability(false);
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !driver) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

            <div>
              <h2 className="font-semibold text-red-900">Unable to load your dashboard</h2>

              <p className="mt-1 text-sm text-red-800">{error ?? 'Driver profile not found.'}</p>

              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOnline = driver.availability === 'ONLINE';

  const approvedDocuments = driver.documents.filter(
    (document) => document.status === 'APPROVED',
  ).length;

  const pendingDocuments = driver.documents.filter(
    (document) => document.status === 'PENDING',
  ).length;

  const activeVehicles = driver.vehicles.filter((vehicle) => vehicle.isActive).length;

  const canGoOnline = driver.approvalStatus === 'APPROVED' && activeVehicles > 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-700">Driver dashboard</p>

        <h1 className="mt-1 text-2xl font-bold text-neutral-900">
          Welcome back, {driver.fullName}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          Manage your availability, vehicles, documents, and delivery activity.
        </p>
      </div>

      {availabilityError && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{availabilityError}</span>
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full',
                  isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600',
                )}
              >
                <Power className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-500">Availability</p>

                <h2 className="text-xl font-bold text-neutral-900">
                  {isOnline ? 'You are online' : 'You are offline'}
                </h2>
              </div>
            </div>

            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              {isOnline
                ? 'You are currently available for delivery assignments.'
                : 'You are not currently available for delivery assignments.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={isUpdatingAvailability || !canGoOnline || isOnline}
              onClick={() => void handleAvailabilityChange('ONLINE')}
              className={cn(
                'rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                isOnline
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-emerald-800 text-white hover:bg-emerald-900',
                (!canGoOnline || isUpdatingAvailability) &&
                  !isOnline &&
                  'cursor-not-allowed opacity-50',
              )}
            >
              {isUpdatingAvailability && !isOnline ? 'Updating...' : 'Go online'}
            </button>

            <button
              type="button"
              disabled={isUpdatingAvailability || !isOnline}
              onClick={() => void handleAvailabilityChange('OFFLINE')}
              className={cn(
                'rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors',
                !isOnline
                  ? 'border-neutral-300 bg-neutral-100 text-neutral-700'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50',
                isUpdatingAvailability && 'cursor-not-allowed opacity-50',
              )}
            >
              {isUpdatingAvailability && isOnline ? 'Updating...' : 'Go offline'}
            </button>
          </div>
        </div>

        {!canGoOnline && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

            <p className="text-sm leading-5 text-amber-800">
              {driver.approvalStatus !== 'APPROVED'
                ? 'Your driver profile must be approved before you can go online.'
                : 'Add at least one active vehicle before you can go online.'}
            </p>
          </div>
        )}
      </section>

      <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Deliveries" value={driver.totalDeliveries} icon={Truck} />

        <StatCard label="Rating" value={driver.rating} icon={CheckCircle2} />

        <StatCard label="Active vehicles" value={activeVehicles} icon={Truck} />

        <StatCard label="Approved documents" value={approvedDocuments} icon={FileText} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-neutral-900">Driver status</h2>

              <p className="mt-1 text-sm text-neutral-500">Current verification status.</p>
            </div>

            <StatusBadge status={driver.approvalStatus} />
          </div>

          <div className="mt-6 space-y-4">
            <StatusRow
              label="Driver approval"
              value={driver.approvalStatus}
              status={
                driver.approvalStatus === 'APPROVED'
                  ? 'success'
                  : driver.approvalStatus === 'REJECTED'
                    ? 'error'
                    : 'pending'
              }
            />

            <StatusRow
              label="Documents pending"
              value={String(pendingDocuments)}
              status={pendingDocuments === 0 ? 'success' : 'pending'}
            />

            <StatusRow
              label="Active vehicles"
              value={String(activeVehicles)}
              status={activeVehicles > 0 ? 'success' : 'pending'}
            />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <div>
            <h2 className="font-semibold text-neutral-900">Quick actions</h2>

            <p className="mt-1 text-sm text-neutral-500">Manage your driver profile.</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickLink
              href="/driver/vehicles"
              icon={Truck}
              title="Vehicles"
              description="Manage your vehicles"
            />

            <QuickLink
              href="/driver/documents"
              icon={FileText}
              title="Documents"
              description="Manage verification documents"
            />
          </div>
        </section>
      </div>

      {driver.currentLat !== null && driver.currentLng !== null && (
        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <MapPin className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-neutral-900">Last known location</h2>

              <p className="mt-1 text-sm text-neutral-500">
                Your most recently recorded driver location.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                Latitude
              </p>

              <p className="mt-1 font-semibold text-neutral-900">{driver.currentLat}</p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                Longitude
              </p>

              <p className="mt-1 font-semibold text-neutral-900">{driver.currentLng}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Truck;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</p>

        <Icon className="h-5 w-5 text-neutral-400" />
      </div>

      <p className="mt-3 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  const config = {
    PENDING: {
      label: 'Pending',
      className: 'bg-amber-50 text-amber-800',
    },
    APPROVED: {
      label: 'Approved',
      className: 'bg-emerald-50 text-emerald-800',
    },
    REJECTED: {
      label: 'Rejected',
      className: 'bg-red-50 text-red-800',
    },
  }[status];

  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  );
}

function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'success' | 'pending' | 'error';
}) {
  const Icon = status === 'success' ? CheckCircle2 : status === 'error' ? CircleAlert : Clock3;

  const iconClass =
    status === 'success'
      ? 'text-emerald-600'
      : status === 'error'
        ? 'text-red-600'
        : 'text-amber-600';

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-neutral-600">{label}</span>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-900">{value}</span>

        <Icon className={cn('h-4 w-4', iconClass)} />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Truck;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-neutral-200 p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
    >
      <Icon className="h-5 w-5 text-neutral-500 group-hover:text-emerald-700" />

      <h3 className="mt-3 text-sm font-semibold text-neutral-900">{title}</h3>

      <p className="mt-1 text-xs text-neutral-500">{description}</p>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="mt-3 h-8 w-72 animate-pulse rounded bg-neutral-200" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-neutral-200" />
      </div>

      <div className="mb-8 h-44 animate-pulse rounded-2xl bg-neutral-100" />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-neutral-100" />
        <div className="h-64 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    </div>
  );
}
