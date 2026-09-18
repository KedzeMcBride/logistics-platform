'use client';

import { useAuth } from '@/features/auth/use-auth';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Profile</h2>
        <p className="mt-1 text-sm text-neutral-500">Your account details.</p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <dl className="space-y-4">
          <Field label="Email" value={user?.email ?? '—'} />
          <Field label="Name" value={user?.fullName ?? '—'} />
          <Field label="Role" value={user?.role ?? '—'} />
        </dl>

        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="text-xs text-neutral-500">Profile editing coming soon.</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sm font-medium text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-900">{value}</dd>
    </div>
  );
}
