import type { DriversService } from '../drivers';
import type { PrismaService } from '../prisma/prisma.service';

import { AssignmentService } from './assignment.service';
import { NoAvailableDriverError } from './no-available-driver.error';

type MockTx = {
  delivery: { update: jest.Mock };
  deliveryStatusHistory: { create: jest.Mock };
};

describe('AssignmentService', () => {
  let service: AssignmentService;
  let prisma: {
    delivery: { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let drivers: { findNearby: jest.Mock };
  let lastTx: MockTx | undefined;

  const baseDelivery = {
    id: 'delivery-1',
    status: 'CONFIRMED',
    pickupLat: 4.05,
    pickupLng: 9.7,
    packageWeightKg: 10,
  };

  function candidate(
    driverId: string,
    vehicles: { capacityKg: number | null }[] = [{ capacityKg: null }],
  ) {
    return { driverId, distanceKm: 1, lat: 4.05, lng: 9.7, vehicles };
  }

  beforeEach(() => {
    lastTx = undefined;
    prisma = {
      delivery: {
        findUnique: jest.fn().mockResolvedValue(baseDelivery),
        update: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: jest.fn(async (fn: (tx: MockTx) => Promise<void>) => {
        const tx: MockTx = {
          delivery: { update: jest.fn() },
          deliveryStatusHistory: { create: jest.fn() },
        };
        lastTx = tx;
        await fn(tx);
        return tx;
      }),
    };
    drivers = { findNearby: jest.fn() };

    service = new AssignmentService(
      prisma as unknown as PrismaService,
      drivers as unknown as DriversService,
    );
  });

  describe('assignDriver — happy path', () => {
    it('assigns the nearest eligible driver and moves the delivery to DRIVER_ASSIGNED', async () => {
      drivers.findNearby.mockResolvedValue([
        candidate('driver-1', [{ capacityKg: 20 }]),
        candidate('driver-2', [{ capacityKg: 50 }]),
      ]);

      const result = await service.assignDriver('delivery-1');

      expect(result).toEqual({
        outcome: 'assigned',
        deliveryId: 'delivery-1',
        driverId: 'driver-1',
      });

      expect(drivers.findNearby).toHaveBeenCalledWith({
        lat: baseDelivery.pickupLat,
        lng: baseDelivery.pickupLng,
        radiusKm: expect.any(Number),
        limit: expect.any(Number),
      });

      // Two transactions: CONFIRMED -> SEARCHING_FOR_DRIVER, then the
      // assignment itself.
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: { assignmentAttempts: { increment: 1 } },
      });
      expect(lastTx!.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: { driverId: 'driver-1', status: 'DRIVER_ASSIGNED' },
      });
      expect(lastTx!.deliveryStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveryId: 'delivery-1',
            fromStatus: 'SEARCHING_FOR_DRIVER',
            toStatus: 'DRIVER_ASSIGNED',
          }),
        }),
      );
    });

    it('does not re-transition CONFIRMED->SEARCHING when already SEARCHING_FOR_DRIVER (a retry)', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        status: 'SEARCHING_FOR_DRIVER',
      });
      drivers.findNearby.mockResolvedValue([candidate('driver-1')]);

      await service.assignDriver('delivery-1');

      // Only the assignment transaction, not a second CONFIRMED->SEARCHING one.
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('assignDriver — capacity validation', () => {
    it('skips a candidate whose only vehicle is under the package weight', async () => {
      drivers.findNearby.mockResolvedValue([
        candidate('driver-too-small', [{ capacityKg: 5 }]), // package is 10kg
        candidate('driver-big-enough', [{ capacityKg: 15 }]),
      ]);

      const result = await service.assignDriver('delivery-1');

      expect(result).toEqual({
        outcome: 'assigned',
        deliveryId: 'delivery-1',
        driverId: 'driver-big-enough',
      });
    });

    it('treats a vehicle with no declared capacity as eligible', async () => {
      drivers.findNearby.mockResolvedValue([candidate('driver-1', [{ capacityKg: null }])]);

      const result = await service.assignDriver('delivery-1');

      expect(result).toEqual({
        outcome: 'assigned',
        deliveryId: 'delivery-1',
        driverId: 'driver-1',
      });
    });

    it('picks a driver with any eligible vehicle among several', async () => {
      drivers.findNearby.mockResolvedValue([
        candidate('driver-1', [{ capacityKg: 2 }, { capacityKg: 25 }]),
      ]);

      const result = await service.assignDriver('delivery-1');

      expect(result).toEqual({
        outcome: 'assigned',
        deliveryId: 'delivery-1',
        driverId: 'driver-1',
      });
    });

    it('throws NoAvailableDriverError when every nearby candidate is under capacity', async () => {
      drivers.findNearby.mockResolvedValue([
        candidate('driver-1', [{ capacityKg: 1 }]),
        candidate('driver-2', [{ capacityKg: 2 }]),
      ]);

      await expect(service.assignDriver('delivery-1')).rejects.toBeInstanceOf(
        NoAvailableDriverError,
      );
    });
  });

  describe('assignDriver — failure / edge paths', () => {
    it('throws NoAvailableDriverError when no driver is nearby at all', async () => {
      drivers.findNearby.mockResolvedValue([]);

      await expect(service.assignDriver('delivery-1')).rejects.toBeInstanceOf(
        NoAvailableDriverError,
      );
    });

    it('returns "skipped" if the delivery no longer exists', async () => {
      prisma.delivery.findUnique.mockResolvedValue(null);

      const result = await service.assignDriver('delivery-1');

      expect(result).toEqual({
        outcome: 'skipped',
        deliveryId: 'delivery-1',
        reason: expect.stringContaining('no longer exists'),
      });
      expect(drivers.findNearby).not.toHaveBeenCalled();
    });

    it('returns "skipped" if the delivery already moved past the assignable window (e.g. cancelled)', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery, status: 'CANCELLED' });

      const result = await service.assignDriver('delivery-1');

      expect(result.outcome).toBe('skipped');
      expect(drivers.findNearby).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('propagates a Redis/nearby-query failure so a retrying caller can retry it', async () => {
      drivers.findNearby.mockRejectedValue(new Error('Unable to search for nearby drivers'));

      await expect(service.assignDriver('delivery-1')).rejects.toThrow(/Unable to search/);
    });
  });

  describe('markFailed', () => {
    it('marks the delivery FAILED when it is still SEARCHING_FOR_DRIVER', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        status: 'SEARCHING_FOR_DRIVER',
      });

      await service.markFailed('delivery-1', 'no drivers');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(lastTx!.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: { status: 'FAILED' },
      });
    });

    it('does not clobber a delivery that already moved on (e.g. cancelled) before failure was handled', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery, status: 'CANCELLED' });

      await service.markFailed('delivery-1', 'no drivers');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does nothing if the delivery no longer exists', async () => {
      prisma.delivery.findUnique.mockResolvedValue(null);

      await service.markFailed('delivery-1', 'no drivers');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
