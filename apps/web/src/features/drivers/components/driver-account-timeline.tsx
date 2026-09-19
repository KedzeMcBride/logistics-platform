'use client';

import { Clock3 } from 'lucide-react';

import type { DriverProfileDto } from '@/features/drivers/use-driver';

type DriverAccountTimelineProps = {
  driver: DriverProfileDto;
};

export function DriverAccountTimeline({ driver }: DriverAccountTimelineProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader
        title="Account Timeline"
        description="Important dates related to your driver account."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoItem label="Account Created" value={formatDate(driver.createdAt)} />

        <InfoItem label="Last Updated" value={formatDate(driver.updatedAt)} />
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

type InfoItemProps = {
  label: string;
  value: string;
};

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
        <Clock3 className="h-5 w-5 text-gray-500" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>

        <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
      </div>
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
