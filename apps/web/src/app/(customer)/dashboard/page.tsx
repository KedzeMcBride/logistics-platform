'use client';

import { useAuth } from '@/features/auth/use-auth';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-neutral-900">
        Welcome back, {user?.fullName ?? user?.email}
      </h1>
      <p className="mt-2 text-neutral-500">Role: {user?.role}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <StatCard label="Active deliveries" value="0" />
        <StatCard label="Completed" value="0" />
        <StatCard label="Unread notifications" value="0" />
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
        <p className="text-neutral-500">Dashboard is under construction. Deliveries coming soon.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
