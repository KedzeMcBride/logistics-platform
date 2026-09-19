import type { DeliveryPriority } from '../enums/delivery-priority';
import type { DeliveryStatus } from '../enums/delivery-status';

export type DeliverySummary = {
  id: string;
  status: DeliveryStatus;
  priority: DeliveryPriority;
  pickupAddress: string;
  destinationAddress: string;
  recipientName: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  estimatedDistanceKm: number | null;
  createdAt: string;
  deliveredAt: string | null;
};

export type DeliveryDto = DeliverySummary & {
  customerId: string;
  driverId: string | null;
  packageDescription: string;
  packageSizeCategory: string;
  packageWeightKg: number;
  recipientPhone: string;
  notes: string | null;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  estimatedDurationMin: number | null;
  updatedAt: string;
  confirmedAt: string | null;
  pickedUpAt: string | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
};

export type DeliveryStatusHistoryDto = {
  id: string;
  deliveryId: string;
  fromStatus: DeliveryStatus | null;
  toStatus: DeliveryStatus;
  changedBy: string;
  reason: string | null;
  createdAt: string;
};

export type CreateDeliveryInput = {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  packageDescription: string;
  packageSizeCategory: 'SMALL' | 'MEDIUM' | 'LARGE';
  packageWeightKg: number;
  priority: DeliveryPriority;
  recipientName: string;
  recipientPhone: string;
  notes?: string;
};
