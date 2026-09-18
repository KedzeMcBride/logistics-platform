import type { DeliveryStatus } from '../enums/delivery-status.js';

/**
 * Server → Client payloads
 */
export type DeliveryStatusChangedPayload = {
  deliveryId: string;
  status: DeliveryStatus;
  timestamp: string;
};

export type DeliveryDriverLocationPayload = {
  deliveryId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  eta?: number;
};

export type DeliveryOfferPayload = {
  deliveryId: string;
  pickup: { address: string; lat: number; lng: number };
  destination: { address: string; lat: number; lng: number };
  estimatedEarnings: number;
  expiresAt: string;
};

export type NotificationNewPayload = {
  id: string;
  type: string;
  title: string;
  body: string;
};

/**
 * Client → Server payloads
 */
export type DriverLocationUpdatePayload = {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
};

export type JoinDeliveryRoomPayload = {
  deliveryId: string;
};

export type LeaveDeliveryRoomPayload = {
  deliveryId: string;
};
