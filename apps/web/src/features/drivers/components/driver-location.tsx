'use client';

import { LoaderCircle, MapPin } from 'lucide-react';
import { useState } from 'react';

import type { DriverProfileDto } from '@/features/drivers/use-driver';

type DriverLocationProps = {
  driver: DriverProfileDto;
  /** Requests a fresh browser location and persists it. Optional so the
   * component still renders read-only in contexts without geolocation
   * wiring (e.g. future admin views of another driver's profile). */
  onRefreshLocation?: () => Promise<unknown>;
};

export function DriverLocation({ driver, onRefreshLocation }: DriverLocationProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const hasLocation = driver.currentLat !== null && driver.currentLng !== null;

  async function handleRefresh() {
    if (!onRefreshLocation || isRefreshing) return;

    setIsRefreshing(true);
    setRefreshError(null);

    try {
      await onRefreshLocation();
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Unable to update your location');
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Last Known Location"
          description="Your most recently recorded driver location."
        />

        {onRefreshLocation && (
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {isRefreshing ? 'Updating…' : 'Update location'}
          </button>
        )}
      </div>

      {refreshError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {refreshError}
        </p>
      )}

      <div className="mt-6">
        {hasLocation ? (
          <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Location Available</p>

              <div className="mt-2 grid gap-1 text-sm text-gray-600 sm:grid-cols-2 sm:gap-x-8">
                <p>
                  <span className="font-medium text-gray-700">Latitude:</span>{' '}
                  {driver.currentLat?.toFixed(6)}
                </p>

                <p>
                  <span className="font-medium text-gray-700">Longitude:</span>{' '}
                  {driver.currentLng?.toFixed(6)}
                </p>
              </div>

              {driver.lastLocationAt && (
                <p className="mt-2 text-xs text-gray-500">
                  Last updated: {formatDate(driver.lastLocationAt)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <MapPin className="h-5 w-5 text-gray-500" />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">No Location Available</p>

              <p className="mt-1 text-sm text-gray-500">
                Your driver location has not been recorded yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  description: string;
};

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
