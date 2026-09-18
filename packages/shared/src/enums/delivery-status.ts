export const DeliveryStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SEARCHING_FOR_DRIVER: 'SEARCHING_FOR_DRIVER',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  DRIVER_ACCEPTED: 'DRIVER_ACCEPTED',
  DRIVER_EN_ROUTE_TO_PICKUP: 'DRIVER_EN_ROUTE_TO_PICKUP',
  ARRIVED_AT_PICKUP: 'ARRIVED_AT_PICKUP',
  PACKAGE_PICKED_UP: 'PACKAGE_PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED_AT_DESTINATION: 'ARRIVED_AT_DESTINATION',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  RETURNED: 'RETURNED',
  EXPIRED: 'EXPIRED',
} as const;

export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const ALL_DELIVERY_STATUSES: readonly DeliveryStatus[] = Object.values(DeliveryStatus);

/** Terminal statuses — delivery will not transition further */
export const TERMINAL_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  DeliveryStatus.DELIVERED,
  DeliveryStatus.CANCELLED,
  DeliveryStatus.FAILED,
  DeliveryStatus.RETURNED,
  DeliveryStatus.EXPIRED,
];

/** In-progress statuses — delivery is actively moving */
export const ACTIVE_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  DeliveryStatus.CONFIRMED,
  DeliveryStatus.SEARCHING_FOR_DRIVER,
  DeliveryStatus.DRIVER_ASSIGNED,
  DeliveryStatus.DRIVER_ACCEPTED,
  DeliveryStatus.DRIVER_EN_ROUTE_TO_PICKUP,
  DeliveryStatus.ARRIVED_AT_PICKUP,
  DeliveryStatus.PACKAGE_PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.ARRIVED_AT_DESTINATION,
];
