'use client';

import { XCircle } from 'lucide-react';

import {
  DriverAccountInfo,
  DriverAccountTimeline,
  DriverDocumentsVehicles,
  DriverLocation,
  DriverPerformance,
  DriverProfileHeader,
  DriverProfileSkeleton,
  DriverStatusCard,
} from '@/features/drivers/components';
import { useDriverProfile } from '@/features/drivers/use-driver';

export default function DriverProfilePage() {
  const { driver, isLoading, error, refetch } = useDriverProfile();

  // Loading state
  if (isLoading) {
    return <DriverProfileSkeleton />;
  }

  // Error state
  if (error || !driver) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <h2 className="font-semibold text-red-900">Unable to load your profile</h2>

                <p className="mt-1 text-sm text-red-700">{error ?? 'Driver profile not found.'}</p>

                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Calculate profile statistics
  const approvedDocuments = driver.documents.filter(
    (document) => document.status === 'APPROVED',
  ).length;

  const pendingDocuments = driver.documents.filter(
    (document) => document.status === 'PENDING',
  ).length;

  const activeVehicles = driver.vehicles.filter((vehicle) => vehicle.isActive).length;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page heading */}
        <div>
          <p className="text-sm font-medium text-blue-600">Driver Portal</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            View your driver account information and status.
          </p>
        </div>

        {/* Profile header */}
        <DriverProfileHeader driver={driver} />

        {/* Account information */}
        <DriverAccountInfo driver={driver} />

        {/* Driver status */}
        <DriverStatusCard driver={driver} />

        {/* Performance */}
        <DriverPerformance driver={driver} activeVehicles={activeVehicles} />

        {/* Documents and vehicles */}
        <DriverDocumentsVehicles
          driver={driver}
          approvedDocuments={approvedDocuments}
          pendingDocuments={pendingDocuments}
          activeVehicles={activeVehicles}
        />

        {/* Last known location */}
        <DriverLocation driver={driver} />

        {/* Account timeline */}
        <DriverAccountTimeline driver={driver} />
      </div>
    </main>
  );
}
