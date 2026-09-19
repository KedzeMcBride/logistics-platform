'use client';

import { cn } from '@/lib/utils';
import type { DriverProfileDto } from '../use-driver';
import Image from 'next/image';

type DriverProfileHeaderProps = {
  driver: DriverProfileDto;
};

export function DriverProfileHeader({ driver }: DriverProfileHeaderProps) {
  const isOnline = driver.availability === 'ONLINE';

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header background */}
      <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 sm:h-40" />

      {/* Profile information */}
      <div className="relative px-5 pb-6 sm:px-8">
        <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
          {/* Avatar + name */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg sm:h-36 sm:w-36">
                {driver.avatarUrl ? (
                  <Image
                    src={driver.avatarUrl}
                    alt={`${driver.fullName}'s profile`}
                    width={144}
                    height={144}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-gray-500 sm:text-4xl">
                    {getInitials(driver.fullName)}
                  </span>
                )}
              </div>

              {/* Online/offline indicator */}
              <span
                className={cn(
                  'absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white',
                  isOnline ? 'bg-green-500' : 'bg-gray-400',
                )}
                title={isOnline ? 'Online' : 'Offline'}
              />
            </div>

            {/* Name and basic information */}
            <div className="pb-1">
              <h2 className="text-2xl font-bold text-gray-900">{driver.fullName}</h2>

              <p className="mt-1 text-sm text-gray-500">Driver ID: {driver.id}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Approval status */}
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    getApprovalVariant(driver.approvalStatus),
                  )}
                >
                  {formatStatus(driver.approvalStatus)}
                </span>

                {/* Availability */}
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700',
                  )}
                >
                  {formatStatus(driver.availability)}
                </span>
              </div>
            </div>
          </div>

          {/* Account status */}
          <div className="flex items-center gap-2 self-start sm:self-end">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                driver.user.isActive && !driver.user.isSuspended ? 'bg-green-500' : 'bg-red-500',
              )}
            />

            <span className="text-sm font-medium text-gray-600">
              {driver.user.isSuspended
                ? 'Account Suspended'
                : driver.user.isActive
                  ? 'Account Active'
                  : 'Account Inactive'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'D';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getApprovalVariant(status: DriverProfileDto['approvalStatus']): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700';

    case 'REJECTED':
      return 'bg-red-100 text-red-700';

    case 'PENDING':
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
}
