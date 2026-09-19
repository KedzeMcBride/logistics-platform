'use client';

import type { CreateDeliveryInput, DeliveryPriority, DeliveryStatus } from '@repo/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { apiClient } from '@/lib/api-client';

export type DeliveryDto = {
  id: string;
  customerId: string;
  driverId: string | null;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  packageDescription: string;
  packageSizeCategory: string;
  packageWeightKg: number;
  priority: DeliveryPriority;
  recipientName: string;
  recipientPhone: string;
  notes: string | null;
  status: DeliveryStatus;
  estimatedDistanceKm: number | null;
  estimatedDurationMin: number | null;
  estimatedPrice: string | null;
  finalPrice: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  statusHistory?: DeliveryStatusHistoryDto[];
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

export type PaginatedDeliveries = {
  items: DeliveryDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type QuoteResponse = {
  distanceKm: number;
  durationMin: number;
  pricing: {
    baseFee: number;
    distanceFee: number;
    weightFee: number;
    prioritySurcharge: number;
    total: number;
    currency: 'XAF';
  };
};

// ---------------------------------------------------------------------------
// useDeliveries — list + filters
// ---------------------------------------------------------------------------

export function useDeliveries(options: { status?: DeliveryStatus; enabled?: boolean } = {}) {
  const { status, enabled = true } = options;
  const [items, setItems] = useState<DeliveryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const query = status ? `?status=${status}` : '';
      const result = await apiClient.get<PaginatedDeliveries>(`/deliveries${query}`, {
        auth: true,
      });
      if (!mountedRef.current) return;
      setItems(result.items);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load deliveries');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [status, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    void fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  return { items, isLoading, error, refetch: fetch };
}

// ---------------------------------------------------------------------------
// useDelivery — single detail
// ---------------------------------------------------------------------------

export function useDelivery(id: string | null) {
  const [delivery, setDelivery] = useState<DeliveryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const result = await apiClient.get<DeliveryDto>(`/deliveries/${id}`, { auth: true });
      if (!mountedRef.current) return;
      setDelivery(result);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load delivery');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    void fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  return { delivery, isLoading, error, refetch: fetch };
}

// ---------------------------------------------------------------------------
// Delivery mutations
// ---------------------------------------------------------------------------

export async function quoteDelivery(input: {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  packageWeightKg: number;
  priority: DeliveryPriority;
}): Promise<QuoteResponse> {
  return apiClient.post<QuoteResponse>('/deliveries/quote', input, { auth: true });
}

export async function createDelivery(input: CreateDeliveryInput): Promise<DeliveryDto> {
  return apiClient.post<DeliveryDto>('/deliveries', input, { auth: true });
}

export async function confirmDelivery(id: string): Promise<DeliveryDto> {
  return apiClient.patch<DeliveryDto>(`/deliveries/${id}/confirm`, undefined, { auth: true });
}

export async function cancelDelivery(id: string, reason?: string): Promise<DeliveryDto> {
  return apiClient.patch<DeliveryDto>(`/deliveries/${id}/cancel`, { reason }, { auth: true });
}
