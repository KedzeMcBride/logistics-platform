import { Injectable } from '@nestjs/common';
import type { DeliveryPriority } from '@repo/shared';

// Pricing is in XAF (Central African CFA Franc). No cents — integers only.
const BASE_FEE = 1000;
const PER_KM_FEE = 150;
const PER_KG_FEE = 50;

const PRIORITY_SURCHARGE: Record<DeliveryPriority, number> = {
  STANDARD: 0,
  EXPRESS: 1000,
  SAME_DAY: 2500,
};

export type PricingInput = {
  distanceKm: number;
  weightKg: number;
  priority: DeliveryPriority;
};

export type PricingResult = {
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  prioritySurcharge: number;
  total: number;
  currency: 'XAF';
};

@Injectable()
export class PricingService {
  calculate(input: PricingInput): PricingResult {
    // Round each component to whole XAF — no decimals in FCFA
    const distanceFee = Math.round(input.distanceKm * PER_KM_FEE);
    const weightFee = Math.round(input.weightKg * PER_KG_FEE);
    const prioritySurcharge = PRIORITY_SURCHARGE[input.priority];
    const total = BASE_FEE + distanceFee + weightFee + prioritySurcharge;

    return {
      baseFee: BASE_FEE,
      distanceFee,
      weightFee,
      prioritySurcharge,
      total,
      currency: 'XAF',
    };
  }

  haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  estimateDurationMin(distanceKm: number): number {
    return Math.max(5, Math.round((distanceKm / 25) * 60));
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
