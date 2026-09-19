import type { DeliveryStatus } from '@repo/shared';

import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SEARCHING_FOR_DRIVER: 'Searching for driver',
  DRIVER_ASSIGNED: 'Driver assigned',
  DRIVER_ACCEPTED: 'Driver accepted',
  DRIVER_EN_ROUTE_TO_PICKUP: 'En route to pickup',
  ARRIVED_AT_PICKUP: 'At pickup',
  PACKAGE_PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  ARRIVED_AT_DESTINATION: 'At destination',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  RETURNED: 'Returned',
  EXPIRED: 'Expired',
};

const STATUS_STYLE: Record<DeliveryStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  SEARCHING_FOR_DRIVER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DRIVER_ASSIGNED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DRIVER_ACCEPTED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DRIVER_EN_ROUTE_TO_PICKUP: 'bg-sky-100 text-sky-800 border-sky-200',
  ARRIVED_AT_PICKUP: 'bg-sky-100 text-sky-800 border-sky-200',
  PACKAGE_PICKED_UP: 'bg-sky-100 text-sky-800 border-sky-200',
  IN_TRANSIT: 'bg-sky-100 text-sky-800 border-sky-200',
  ARRIVED_AT_DESTINATION: 'bg-teal-100 text-teal-800 border-teal-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  RETURNED: 'bg-orange-100 text-orange-800 border-orange-200',
  EXPIRED: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

export function DeliveryStatusBadge({
  status,
  className,
}: {
  status: DeliveryStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
