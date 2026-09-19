'use client';

import { MapPin } from 'lucide-react';

import type { DriverProfileDto } from '@/features/drivers/use-driver';

type DriverLocationProps = {
  driver: DriverProfileDto;
};

export function DriverLocation({ driver }: DriverLocationProps) {
  const hasLocation = driver.currentLat !== null && driver.currentLng !== null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader
        title="Last Known Location"
        description="Your most recently recorded driver location."
      />

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
