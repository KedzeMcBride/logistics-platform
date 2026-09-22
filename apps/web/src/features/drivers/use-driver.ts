'use client';

import type { DriverAvailability } from '@repo/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { apiClient } from '@/lib/api-client';

export type VehicleDto = {
  id: string;
  driverId: string;
  type: string;
  plateNumber: string;
  capacityKg: number | null;
  isActive: boolean;
  createdAt: string;
};

export type DriverDocumentDto = {
  id: string;
  driverId: string;
  type: string;
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type DriverProfileDto = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  availability: DriverAvailability;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rating: string;
  totalDeliveries: number;
  currentLat: number | null;
  currentLng: number | null;
  lastLocationAt: string | null;
  createdAt: string;
  updatedAt: string;
  vehicles: VehicleDto[];
  documents: DriverDocumentDto[];
  user: {
    email: string;
    phone: string | null;
    isActive: boolean;
    isSuspended: boolean;
  };
};

export type GeolocationCoords = { lat: number; lng: number };

/**
 * Resolves the browser's current position, or rejects with a readable
 * message. Used as a best-effort location source — callers decide whether
 * a failure here should block the surrounding action.
 */
export function getBrowserLocation(options?: PositionOptions): Promise<GeolocationCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => {
        reject(new Error(err.message || 'Unable to determine your location'));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0, ...options },
    );
  });
}

export function useDriverProfile() {
  const [driver, setDriver] = useState<DriverProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.get<DriverProfileDto>('/drivers/me', { auth: true });
      if (!mountedRef.current) return;
      setDriver(result);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load driver profile');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  const setAvailability = useCallback(
    async (availability: DriverAvailability, location?: GeolocationCoords) => {
      const updated = await apiClient.patch<DriverProfileDto>(
        '/drivers/availability',
        { availability, ...(location ? { lat: location.lat, lng: location.lng } : {}) },
        { auth: true },
      );
      setDriver((prev) =>
        prev
          ? {
              ...prev,
              availability: updated.availability,
              currentLat: updated.currentLat,
              currentLng: updated.currentLng,
              lastLocationAt: updated.lastLocationAt,
            }
          : null,
      );
      return updated;
    },
    [],
  );

  const updateLocation = useCallback(async (location: GeolocationCoords) => {
    const updated = await apiClient.patch<DriverProfileDto>('/drivers/location', location, {
      auth: true,
    });
    setDriver((prev) =>
      prev
        ? {
            ...prev,
            currentLat: updated.currentLat,
            currentLng: updated.currentLng,
            lastLocationAt: updated.lastLocationAt,
          }
        : null,
    );
    return updated;
  }, []);

  return { driver, isLoading, error, refetch: fetch, setAvailability, updateLocation };
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export async function addVehicle(input: {
  type: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';
  plateNumber: string;
  capacityKg?: number;
}): Promise<VehicleDto> {
  return apiClient.post<VehicleDto>('/drivers/vehicles', input, { auth: true });
}

export async function updateVehicle(
  id: string,
  input: { plateNumber?: string; capacityKg?: number; isActive?: boolean },
): Promise<VehicleDto> {
  return apiClient.patch<VehicleDto>(`/drivers/vehicles/${id}`, input, { auth: true });
}

export async function deleteVehicle(id: string): Promise<VehicleDto> {
  return apiClient.delete<VehicleDto>(`/drivers/vehicles/${id}`, { auth: true });
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function addDocument(input: {
  type: 'LICENSE' | 'ID' | 'INSURANCE' | 'VEHICLE_REGISTRATION';
  fileUrl: string;
}): Promise<DriverDocumentDto> {
  return apiClient.post<DriverDocumentDto>('/drivers/documents', input, { auth: true });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function listPendingDrivers(): Promise<DriverProfileDto[]> {
  return apiClient.get<DriverProfileDto[]>('/admin/drivers/pending', { auth: true });
}

export async function approveDriver(id: string): Promise<DriverProfileDto> {
  return apiClient.patch<DriverProfileDto>(`/admin/drivers/${id}/approve`, undefined, {
    auth: true,
  });
}

export async function rejectDriver(id: string, reason: string): Promise<DriverProfileDto> {
  return apiClient.patch<DriverProfileDto>(
    `/admin/drivers/${id}/reject`,
    { reason },
    { auth: true },
  );
}

export async function approveDocument(id: string): Promise<DriverDocumentDto> {
  return apiClient.patch<DriverDocumentDto>(`/admin/drivers/documents/${id}/approve`, undefined, {
    auth: true,
  });
}

export async function rejectDocument(id: string): Promise<DriverDocumentDto> {
  return apiClient.patch<DriverDocumentDto>(`/admin/drivers/documents/${id}/reject`, undefined, {
    auth: true,
  });
}
