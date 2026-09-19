'use client';

import { CheckCircle2, Clock3, User, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { DriverProfileDto } from '../use-driver';

type DriverStatusCardProps = {
  driver: DriverProfileDto;
};

export function DriverStatusCard({ driver }: DriverStatusCardProps) {
  const approvalStatus = getApprovalStatus(driver.approvalStatus);
  const availabilityStatus = getAvailabilityStatus(driver.availability);
  const accountStatus = getAccountStatus(driver.user.isActive, driver.user.isSuspended);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader title="Driver Status" description="Current status of your driver account." />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatusCard
          icon={approvalStatus.icon}
          label="Approval"
          value={approvalStatus.label}
          description={approvalStatus.description}
          iconClassName={approvalStatus.iconClassName}
          valueClassName={approvalStatus.valueClassName}
        />

        <StatusCard
          icon={availabilityStatus.icon}
          label="Availability"
          value={availabilityStatus.label}
          description={availabilityStatus.description}
          iconClassName={availabilityStatus.iconClassName}
          valueClassName={availabilityStatus.valueClassName}
        />

        <StatusCard
          icon={accountStatus.icon}
          label="Account"
          value={accountStatus.label}
          description={accountStatus.description}
          iconClassName={accountStatus.iconClassName}
          valueClassName={accountStatus.valueClassName}
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

type StatusCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
  iconClassName: string;
  valueClassName: string;
};

function StatusCard({
  icon: Icon,
  label,
  value,
  description,
  iconClassName,
  valueClassName,
}: StatusCardProps) {
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
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>

          <p className={cn('mt-1 text-sm font-semibold', valueClassName)}>{value}</p>

          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function getApprovalStatus(status: DriverProfileDto['approvalStatus']) {
  switch (status) {
    case 'APPROVED':
      return {
        icon: CheckCircle2,
        label: 'Approved',
        description: 'Your driver account is approved.',
        iconClassName: 'bg-green-100 text-green-600',
        valueClassName: 'text-green-700',
      };

    case 'REJECTED':
      return {
        icon: XCircle,
        label: 'Rejected',
        description: 'Your driver application was rejected.',
        iconClassName: 'bg-red-100 text-red-600',
        valueClassName: 'text-red-700',
      };

    case 'PENDING':
    default:
      return {
        icon: Clock3,
        label: 'Pending',
        description: 'Your driver account is awaiting approval.',
        iconClassName: 'bg-yellow-100 text-yellow-600',
        valueClassName: 'text-yellow-700',
      };
  }
}

function getAvailabilityStatus(availability: DriverProfileDto['availability']) {
  switch (availability) {
    case 'ONLINE':
      return {
        icon: CheckCircle2,
        label: 'Online',
        description: 'You are currently available for deliveries.',
        iconClassName: 'bg-green-100 text-green-600',
        valueClassName: 'text-green-700',
      };

    case 'OFFLINE':
    default:
      return {
        icon: Clock3,
        label: 'Offline',
        description: 'You are currently unavailable for deliveries.',
        iconClassName: 'bg-gray-100 text-gray-600',
        valueClassName: 'text-gray-700',
      };
  }
}

function getAccountStatus(isActive: boolean, isSuspended: boolean) {
  if (isSuspended) {
    return {
      icon: XCircle,
      label: 'Suspended',
      description: 'Your account is currently suspended.',
      iconClassName: 'bg-red-100 text-red-600',
      valueClassName: 'text-red-700',
    };
  }

  if (isActive) {
    return {
      icon: User,
      label: 'Active',
      description: 'Your account is active.',
      iconClassName: 'bg-green-100 text-green-600',
      valueClassName: 'text-green-700',
    };
  }

  return {
    icon: XCircle,
    label: 'Inactive',
    description: 'Your account is currently inactive.',
    iconClassName: 'bg-gray-100 text-gray-600',
    valueClassName: 'text-gray-700',
  };
}
