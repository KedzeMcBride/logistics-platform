import type { DeliveryPriority } from '../enums/delivery-priority.js';
import type { DeliveryStatus } from '../enums/delivery-status.js';
/**
 * Compact delivery shape — used in list views.
 */
export type DeliverySummary = {
  id: string;
  status: DeliveryStatus;
  priority: DeliveryPriority;
  pickupAddress: string;
  destinationAddress: string;
  createdAt: string; // ISO date string
  estimatedPrice: number | null;
};

/**
 * Full delivery shape — used in detail views.
 */
export type DeliveryDto = DeliverySummary & {
  customerId: string;
  driverId: string | null;
  packageDescription: string;
  packageWeightKg: number;
  recipientName: string;
  recipientPhone: string;
  notes: string | null;
  estimatedDistanceKm: number | null;
  estimatedDurationMin: number | null;
  finalPrice: number | null;
  updatedAt: string;
  confirmedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
};
