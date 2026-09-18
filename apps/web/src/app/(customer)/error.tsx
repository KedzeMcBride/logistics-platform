'use client';

import { AlertTriangle } from 'lucide-react';

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" strokeWidth={1.75} />
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-neutral-500">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
