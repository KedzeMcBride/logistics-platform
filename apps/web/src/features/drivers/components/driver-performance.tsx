'use client';

import { Star, Truck } from 'lucide-react';

import type { DriverProfileDto } from '@/features/drivers/use-driver';

type DriverPerformanceProps = {
  driver: DriverProfileDto;
  activeVehicles: number;
};

export function DriverPerformance({ driver, activeVehicles }: DriverPerformanceProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader
        title="Performance"
        description="Your delivery performance and driver statistics."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={Truck}
          label="Total Deliveries"
          value={driver.totalDeliveries.toString()}
          description="Completed deliveries"
          iconClassName="bg-blue-100 text-blue-600"
        />

        <MetricCard
          icon={Star}
          label="Driver Rating"
          value={formatRating(driver.rating)}
          description="Average customer rating"
          iconClassName="bg-yellow-100 text-yellow-600"
        />

        <MetricCard
          icon={Truck}
          label="Active Vehicles"
          value={activeVehicles.toString()}
          description="Currently active vehicles"
          iconClassName="bg-indigo-100 text-indigo-600"
        />
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

type MetricCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
  iconClassName: string;
};

function MetricCard({ icon: Icon, label, value, description, iconClassName }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>

          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>

          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function formatRating(rating: string): string {
  const numericRating = Number(rating);

  if (Number.isNaN(numericRating)) {
    return rating;
  }

  return numericRating.toFixed(1);
}
