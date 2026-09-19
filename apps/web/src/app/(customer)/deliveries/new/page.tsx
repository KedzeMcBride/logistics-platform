import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { CreateDeliveryForm } from '@/features/deliveries/create-delivery-form';

export default function NewDeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/deliveries"
        className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to deliveries
      </Link>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Create a delivery</h2>
        <p className="mt-1 text-sm text-neutral-500">
          We&apos;ll match you with a driver and track the package in real time.
        </p>
      </div>

      <CreateDeliveryForm />
    </div>
  );
}
