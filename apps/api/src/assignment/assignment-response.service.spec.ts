/**
 * Day 16 — Accept / Reject / Timeout test suite.
 *
 * Tests the current AssignmentService implementation using mocked
 * PrismaService, AssignmentQueueService, and DriversService.
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AssignmentService } from './assignment.service';
import { PrismaService } from '../prisma/prisma.service';
import { DriversService } from '../drivers/drivers.service';
import { AssignmentQueueService } from '../queue/assignment-queue.service';

describe('AssignmentService — accept/reject/timeout (Day 16)', () => {
  let service: AssignmentService;

  let prisma: {
    delivery: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    deliveryStatusHistory: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let queue: {
    enqueueAssignment: jest.Mock;
    scheduleResponseTimeout: jest.Mock;
    cancelResponseTimeout: jest.Mock;
  };

  const baseDelivery = {
    id: 'delivery-1',
    status: 'DRIVER_ASSIGNED',
    driverId: 'driver-1',
    assignmentAttempts: 1,
    excludedDriverIds: [] as string[],
    driverResponseDeadline: new Date(Date.now() + 30_000),
    driverRespondedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      delivery: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },

      deliveryStatusHistory: {
        create: jest.fn(),
      },

      // The current AssignmentService uses both:
      //   1. callback-style transactions
      //   2. array-style transactions
      $transaction: jest.fn(async (input) => {
        if (typeof input === 'function') {
          const tx = {
            delivery: {
              update: prisma.delivery.update,
            },
            deliveryStatusHistory: {
              create: prisma.deliveryStatusHistory.create,
            },
          };

          return input(tx);
        }

        return Promise.all(input);
      }),
    };

    queue = {
      enqueueAssignment: jest.fn().mockResolvedValue(undefined),
      scheduleResponseTimeout: jest.fn().mockResolvedValue(undefined),
      cancelResponseTimeout: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: DriversService,
          useValue: {
            findNearby: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AssignmentQueueService,
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get(AssignmentService);
  });

  // ---------------------------------------------------------------------------
  // ACCEPT
  // ---------------------------------------------------------------------------

  describe('acceptAssignment', () => {
    it('accepts happy path: DRIVER_ASSIGNED -> DRIVER_ACCEPTED', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
      });

      prisma.delivery.update.mockResolvedValue({
        ...baseDelivery,
        status: 'DRIVER_ACCEPTED',
        driverRespondedAt: expect.any(Date),
      });

      const result = await service.acceptAssignment('delivery-1', 'driver-1');

      expect(result.status).toBe('DRIVER_ACCEPTED');

      expect(prisma.deliveryStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveryId: 'delivery-1',
            fromStatus: 'DRIVER_ASSIGNED',
            toStatus: 'DRIVER_ACCEPTED',
            changedBy: 'driver-1',
            reason: 'Driver accepted the assignment',
          }),
        }),
      );

      // The current implementation intentionally does not cancel the
      // timeout queue. handleTimeout() checks driverRespondedAt and
      // becomes a no-op if a stale timeout job fires.
      expect(queue.cancelResponseTimeout).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing delivery', async () => {
      prisma.delivery.findUnique.mockResolvedValue(null);

      await expect(service.acceptAssignment('missing', 'driver-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the responding driver is not the assigned one', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        driverId: 'other-driver',
      });

      await expect(service.acceptAssignment('delivery-1', 'driver-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when status is not DRIVER_ASSIGNED', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        status: 'DRIVER_ACCEPTED',
      });

      await expect(service.acceptAssignment('delivery-1', 'driver-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when the response deadline has already passed', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        driverResponseDeadline: new Date(Date.now() - 5_000),
      });

      await expect(service.acceptAssignment('delivery-1', 'driver-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // REJECT
  // ---------------------------------------------------------------------------

  describe('rejectAssignment', () => {
    it('returns the delivery to SEARCHING_FOR_DRIVER and triggers reassignment', async () => {
      prisma.delivery.findUnique
        .mockResolvedValueOnce({
          ...baseDelivery,
        })
        .mockResolvedValueOnce({
          ...baseDelivery,
          status: 'SEARCHING_FOR_DRIVER',
        })
        .mockResolvedValueOnce({
          ...baseDelivery,
          status: 'SEARCHING_FOR_DRIVER',
        });

      prisma.delivery.update.mockResolvedValue({
        ...baseDelivery,
        status: 'SEARCHING_FOR_DRIVER',
        driverId: null,
        driverResponseDeadline: null,
        driverRespondedAt: null,
      });

      const result = await service.rejectAssignment('delivery-1', 'driver-1', 'too far');

      expect(result).toEqual({
        deliveryId: 'delivery-1',
        status: 'reassignment-triggered',
      });

      // returnToSearching() clears the current assignment.
      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: {
          status: 'SEARCHING_FOR_DRIVER',
          driverId: null,
          driverResponseDeadline: null,
          driverRespondedAt: null,
        },
      });

      // reassignOrFail() calls assignDriver(), which increments attempts.
      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: {
          assignmentAttempts: {
            increment: 1,
          },
        },
      });

      // The current AssignmentService performs reassignment directly.
      // It does not enqueue a new assignment here.
      expect(queue.enqueueAssignment).not.toHaveBeenCalled();
    });

    it('does not enqueue another assignment when no nearby driver is available', async () => {
      prisma.delivery.findUnique
        .mockResolvedValueOnce({
          ...baseDelivery,
        })
        .mockResolvedValueOnce({
          ...baseDelivery,
          status: 'SEARCHING_FOR_DRIVER',
        });

      prisma.delivery.update.mockResolvedValue({
        ...baseDelivery,
        status: 'SEARCHING_FOR_DRIVER',
        driverId: null,
        driverResponseDeadline: null,
        driverRespondedAt: null,
      });

      const result = await service.rejectAssignment('delivery-1', 'driver-1');

      expect(result).toEqual({
        deliveryId: 'delivery-1',
        status: 'reassignment-triggered',
      });

      expect(queue.enqueueAssignment).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for a driver who is not assigned to this delivery', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        driverId: 'someone-else',
      });

      await expect(service.rejectAssignment('delivery-1', 'driver-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when the delivery is not in DRIVER_ASSIGNED', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        status: 'DRIVER_ACCEPTED',
      });

      await expect(service.rejectAssignment('delivery-1', 'driver-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // TIMEOUT
  // ---------------------------------------------------------------------------

  describe('handleTimeout', () => {
    it('returns an unresponded assignment to SEARCHING_FOR_DRIVER and triggers reassignment', async () => {
      prisma.delivery.findUnique
        .mockResolvedValueOnce({
          ...baseDelivery,
        })
        .mockResolvedValueOnce({
          ...baseDelivery,
          status: 'SEARCHING_FOR_DRIVER',
        })
        .mockResolvedValueOnce({
          ...baseDelivery,
          status: 'SEARCHING_FOR_DRIVER',
        });

      prisma.delivery.update.mockResolvedValue({
        ...baseDelivery,
        status: 'SEARCHING_FOR_DRIVER',
        driverId: null,
        driverResponseDeadline: null,
        driverRespondedAt: null,
      });

      await service.handleTimeout('delivery-1', 'driver-1', 1);

      expect(prisma.deliveryStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveryId: 'delivery-1',
            fromStatus: 'DRIVER_ASSIGNED',
            toStatus: 'SEARCHING_FOR_DRIVER',
            changedBy: 'driver-1',
            reason: 'Driver driver-1 timed out responding to assignment attempt 1',
          }),
        }),
      );

      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: {
          status: 'SEARCHING_FOR_DRIVER',
          driverId: null,
          driverResponseDeadline: null,
          driverRespondedAt: null,
        },
      });

      // Current implementation calls assignDriver() directly rather than
      // enqueueing a new assignment.
      expect(queue.enqueueAssignment).not.toHaveBeenCalled();
    });

    it('is a no-op if the driver already responded (driverRespondedAt set)', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        driverRespondedAt: new Date(),
      });

      await service.handleTimeout('delivery-1', 'driver-1', 1);

      expect(prisma.delivery.update).not.toHaveBeenCalled();
      expect(queue.enqueueAssignment).not.toHaveBeenCalled();
    });

    it('is a no-op if the delivery moved to a different driver/status already', async () => {
      prisma.delivery.findUnique.mockResolvedValue({
        ...baseDelivery,
        status: 'DRIVER_ACCEPTED',
      });

      await service.handleTimeout('delivery-1', 'driver-1', 1);

      expect(prisma.delivery.update).not.toHaveBeenCalled();
      expect(queue.enqueueAssignment).not.toHaveBeenCalled();
    });

    it('is a no-op if the delivery no longer exists', async () => {
      prisma.delivery.findUnique.mockResolvedValue(null);

      await expect(service.handleTimeout('delivery-1', 'driver-1', 1)).resolves.toBeUndefined();

      expect(prisma.delivery.update).not.toHaveBeenCalled();
      expect(queue.enqueueAssignment).not.toHaveBeenCalled();
    });
  });
});
