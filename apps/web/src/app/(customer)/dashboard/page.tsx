'use client';

import { Package, Truck, Bell } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/features/auth/use-auth';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">
          Welcome back, {user?.fullName ?? user?.email}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Here&apos;s what&apos;s happening with your deliveries.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={Package} label="Active deliveries" value="0" />
        <StatCard icon={Truck} label="Completed" value="0" />
        <StatCard icon={Bell} label="Unread notifications" value="0" />
      </div>

      <div className="mt-8">
        <EmptyState
          icon={Package}
          title="No deliveries yet"
          description="Create your first delivery to see it tracked here in real time."
          action={
            <button
              type="button"
              className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
              disabled
            >
              Create delivery (coming soon)
            </button>
          }
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</p>
        <Icon className="h-5 w-5 text-neutral-400" strokeWidth={1.75} />
      </div>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
