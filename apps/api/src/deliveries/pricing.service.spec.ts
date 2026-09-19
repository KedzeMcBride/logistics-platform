import { Test, TestingModule } from '@nestjs/testing';

import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingService],
    }).compile();

    service = module.get(PricingService);
  });

  describe('calculate', () => {
    it('computes STANDARD price in XAF', () => {
      const result = service.calculate({ distanceKm: 2, weightKg: 1, priority: 'STANDARD' });
      expect(result.baseFee).toBe(1000);
      expect(result.distanceFee).toBe(300);
      expect(result.weightFee).toBe(50);
      expect(result.prioritySurcharge).toBe(0);
      expect(result.total).toBe(1350);
      expect(result.currency).toBe('XAF');
    });

    it('adds EXPRESS surcharge', () => {
      const result = service.calculate({ distanceKm: 2, weightKg: 1, priority: 'EXPRESS' });
      expect(result.prioritySurcharge).toBe(1000);
      expect(result.total).toBe(2350);
    });

    it('adds SAME_DAY surcharge', () => {
      const result = service.calculate({ distanceKm: 2, weightKg: 1, priority: 'SAME_DAY' });
      expect(result.prioritySurcharge).toBe(2500);
      expect(result.total).toBe(3850);
    });

    it('rounds fees to whole XAF', () => {
      const result = service.calculate({
        distanceKm: 2.38,
        weightKg: 2.5,
        priority: 'STANDARD',
      });
      expect(result.distanceFee).toBe(357);
      expect(result.weightFee).toBe(125);
      expect(Number.isInteger(result.distanceFee)).toBe(true);
      expect(Number.isInteger(result.weightFee)).toBe(true);
    });

    it('returns XAF for every priority', () => {
      const priorities = ['STANDARD', 'EXPRESS', 'SAME_DAY'] as const;
      for (const priority of priorities) {
        const result = service.calculate({ distanceKm: 1, weightKg: 1, priority });
        expect(result.currency).toBe('XAF');
      }
    });
  });

  describe('haversineKm', () => {
    it('returns 0 for identical points', () => {
      expect(service.haversineKm(39.78, -89.65, 39.78, -89.65)).toBe(0);
    });

    it('returns a positive distance for distinct points', () => {
      const km = service.haversineKm(39.78, -89.65, 39.8, -89.64);
      expect(km).toBeGreaterThan(0);
      expect(km).toBeLessThan(5);
    });

    it('is symmetric', () => {
      const a = service.haversineKm(39.78, -89.65, 39.8, -89.64);
      const b = service.haversineKm(39.8, -89.64, 39.78, -89.65);
      expect(a).toBe(b);
    });
  });

  describe('estimateDurationMin', () => {
    it('returns at least 5 minutes', () => {
      expect(service.estimateDurationMin(0)).toBe(5);
      expect(service.estimateDurationMin(0.5)).toBe(5);
    });

    it('estimates based on 25 km/h', () => {
      expect(service.estimateDurationMin(10)).toBe(24);
      expect(service.estimateDurationMin(25)).toBe(60);
    });
  });
});
