'use client';

import { CheckCircle2, FileText, Truck } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { DriverProfileDto } from '@/features/drivers/use-driver';

type DriverDocumentsVehiclesProps = {
  driver: DriverProfileDto;
  approvedDocuments: number;
  pendingDocuments: number;
  activeVehicles: number;
};

export function DriverDocumentsVehicles({
  driver,
  approvedDocuments,
  pendingDocuments,
  activeVehicles,
}: DriverDocumentsVehiclesProps) {
  const totalDocuments = driver.documents.length;
  const totalVehicles = driver.vehicles.length;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader
        title="Documents & Vehicles"
        description="Overview of your submitted documents and registered vehicles."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Documents */}
        <SummaryCard
          icon={FileText}
          title="Documents"
          description="Driver verification documents"
          iconClassName="bg-blue-100 text-blue-600"
        >
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Total" value={totalDocuments} />

            <Stat label="Approved" value={approvedDocuments} valueClassName="text-green-600" />

            <Stat label="Pending" value={pendingDocuments} valueClassName="text-yellow-600" />
          </div>
        </SummaryCard>

        {/* Vehicles */}
        <SummaryCard
          icon={Truck}
          title="Vehicles"
          description="Vehicles registered to your account"
          iconClassName="bg-indigo-100 text-indigo-600"
        >
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Total" value={totalVehicles} />

            <Stat label="Active" value={activeVehicles} valueClassName="text-green-600" />

            <Stat
              label="Inactive"
              value={Math.max(totalVehicles - activeVehicles, 0)}
              valueClassName="text-gray-600"
            />
          </div>
        </SummaryCard>
      </div>

      {/* Verification message */}
      {totalDocuments > 0 && (
        <div
          className={cn(
            'mt-4 flex items-start gap-3 rounded-xl border p-4',
            approvedDocuments === totalDocuments
              ? 'border-green-200 bg-green-50'
              : 'border-yellow-200 bg-yellow-50',
          )}
        >
          <CheckCircle2
            className={cn(
              'mt-0.5 h-5 w-5 shrink-0',
              approvedDocuments === totalDocuments ? 'text-green-600' : 'text-yellow-600',
            )}
          />

          <div>
            <p
              className={cn(
                'text-sm font-medium',
                approvedDocuments === totalDocuments ? 'text-green-800' : 'text-yellow-800',
              )}
            >
              {approvedDocuments === totalDocuments
                ? 'All documents approved'
                : 'Document verification in progress'}
            </p>

            <p
              className={cn(
                'mt-1 text-xs',
                approvedDocuments === totalDocuments ? 'text-green-700' : 'text-yellow-700',
              )}
            >
              {approvedDocuments === totalDocuments
                ? 'Your submitted documents have been approved.'
                : `${pendingDocuments} document${pendingDocuments === 1 ? '' : 's'} ${
                    pendingDocuments === 1 ? 'is' : 'are'
                  } still awaiting review.`}
            </p>
          </div>
        </div>
      )}
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

type SummaryCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconClassName: string;
  children: React.ReactNode;
};

function SummaryCard({
  icon: Icon,
  title,
  description,
  iconClassName,
  children,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

type StatProps = {
  label: string;
  value: number;
  valueClassName?: string;
};

function Stat({ label, value, valueClassName = 'text-gray-900' }: StatProps) {
  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-sm">
      <p className={cn('text-xl font-bold', valueClassName)}>{value}</p>

      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}
