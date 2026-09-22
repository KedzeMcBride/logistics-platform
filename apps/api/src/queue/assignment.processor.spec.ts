import type { Job } from 'bullmq';

import type { DriversService } from '../drivers';
import type { PrismaService } from '../prisma/prisma.service';

import { AssignmentProcessor } from './assignment.processor';

type MockTx = {
  delivery: { update: jest.Mock };
  deliveryStatusHistory: { create: jest.Mock };
};

describe('AssignmentProcessor', () => {
  let processor: AssignmentProcessor;
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
  };

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

    processor = new AssignmentProcessor(
      prisma as unknown as PrismaService,
      drivers as unknown as DriversService,
    );
  });

  function makeJob(overrides: Partial<Job<{ deliveryId: string }>> = {}): Job<{
    deliveryId: string;
  }> {
    return {
      data: { deliveryId: 'delivery-1' },
      attemptsMade: 1,
      opts: { attempts: 5 },
      ...overrides,
    } as Job<{ deliveryId: string }>;
  }

  describe('process — happy path', () => {
    it('assigns the nearest available driver and moves the delivery to DRIVER_ASSIGNED', async () => {
      drivers.findNearby.mockResolvedValue([
        { driverId: 'driver-1', distanceKm: 1.2 },
        { driverId: 'driver-2', distanceKm: 3.4 },
      ]);

      await processor.process(makeJob());

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

      // Final transaction assigns the nearest (first) candidate.
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
      drivers.findNearby.mockResolvedValue([{ driverId: 'driver-1', distanceKm: 1 }]);

      await processor.process(makeJob({ attemptsMade: 2 }));

      // Only the assignment transaction, not a second CONFIRMED->SEARCHING one.
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('process — failure / edge paths', () => {
    it('throws (to trigger a BullMQ retry) when no driver is nearby', async () => {
      drivers.findNearby.mockResolvedValue([]);

      await expect(processor.process(makeJob())).rejects.toThrow(/No available drivers/);
    });

    it('drops the job quietly if the delivery no longer exists', async () => {
      prisma.delivery.findUnique.mockResolvedValue(null);

      await expect(processor.process(makeJob())).resolves.toBeUndefined();
      expect(drivers.findNearby).not.toHaveBeenCalled();
    });

    it('skips assignment if the delivery already moved past the assignable window (e.g. cancelled)', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery, status: 'CANCELLED' });

      await processor.process(makeJob());

      expect(drivers.findNearby).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('propagates a Redis/nearby-query failure so BullMQ can retry it', async () => {
      drivers.findNearby.mockRejectedValue(new Error('Unable to search for nearby drivers'));

      await expect(processor.process(makeJob())).rejects.toThrow(/Unable to search/);
    });
  });

  describe('onFailed', () => {
    it('does not touch the delivery while retries remain', async () => {
      await processor.onFailed(
        makeJob({ attemptsMade: 2, opts: { attempts: 5 } }),
        new Error('no drivers'),
      );

      expect(prisma.delivery.findUnique).not.toHaveBeenCalled();
    });

    it('marks the delivery FAILED once the final attempt is exhausted', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        status: 'SEARCHING_FOR_DRIVER',
      });

      await processor.onFailed(
        makeJob({ attemptsMade: 5, opts: { attempts: 5 } }),
        new Error('no drivers'),
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(lastTx!.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: { status: 'FAILED' },
      });
    });

    it('does not clobber a delivery that already moved on before the final failure was handled', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery, status: 'CANCELLED' });

      await processor.onFailed(
        makeJob({ attemptsMade: 5, opts: { attempts: 5 } }),
        new Error('no drivers'),
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('ignores a failed event with no job (BullMQ can emit this)', async () => {
      await expect(processor.onFailed(undefined, new Error('x'))).resolves.toBeUndefined();
    });
  });
});
