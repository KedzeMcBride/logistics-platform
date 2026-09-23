/**
 * Day 16 — Accept / Reject / Timeout test suite.
 *
 * Written to match the existing Day 15 `assignment.service.spec.ts` mocking
 * style (mocked PrismaService, mocked AssignmentQueueService, mocked
 * DriversService) — merge these `describe` blocks into that file, or keep
 * as a sibling spec file if the existing one is already large. Adjust
 * import paths / mock shapes to match the real files once available.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { PrismaService } from '../prisma/prisma.service';
import { DriversService } from '../drivers/drivers.service';
import { AssignmentQueueService } from '../queue/assignment-queue.service';

describe('AssignmentService — accept/reject/timeout (Day 16)', () => {
  let service: AssignmentService;
  let prisma: {
    delivery: { findUnique: jest.Mock; update: jest.Mock };
    deliveryStatusHistory: { create: jest.Mock };
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
      delivery: { findUnique: jest.fn(), update: jest.fn() },
      deliveryStatusHistory: { create: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    queue = {
      enqueueAssignment: jest.fn().mockResolvedValue(undefined),
      scheduleResponseTimeout: jest.fn().mockResolvedValue(undefined),
      cancelResponseTimeout: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: DriversService, useValue: { findNearby: jest.fn() } },
        { provide: AssignmentQueueService, useValue: queue },
      ],
    }).compile();

    service = module.get(AssignmentService);
  });

  // ---- ACCEPT ----

  describe('acceptAssignment', () => {
    it('accepts happy path: DRIVER_ASSIGNED -> DRIVER_ACCEPTED', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery });
      prisma.delivery.update.mockResolvedValue({ ...baseDelivery, status: 'DRIVER_ACCEPTED' });

      const result = await service.acceptAssignment('delivery-1', 'driver-1');

      expect(result.status).toBe('DRIVER_ACCEPTED');
      expect(prisma.deliveryStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRIVER_ACCEPTED',
            reason: 'ACCEPTED_BY_DRIVER',
          }),
        }),
      );
      expect(queue.cancelResponseTimeout).toHaveBeenCalledWith('delivery-1', 1);
    });

    it('throws NotFoundException for a missing delivery', async () => {
      prisma.delivery.findUnique.mockResolvedValue(null);
      await expect(service.acceptAssignment('missing', 'driver-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the responding driver is not the assigned one', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery, driverId: 'other-driver' });
      await expect(service.acceptAssignment('delivery-1', 'driver-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when status is not DRIVER_ASSIGNED', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery, status: 'DRIVER_ACCEPTED' });
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

  // ---- REJECT ----

  describe('rejectAssignment', () => {
    it('rejects happy path: excludes driver, re-enqueues, status -> SEARCHING_FOR_DRIVER', async () => {
      prisma.delivery.findUnique
        .mockResolvedValueOnce({ ...baseDelivery }) // ownership/status check
        .mockResolvedValueOnce({ ...baseDelivery }); // inside handleDriverUnavailable if it re-fetches
      prisma.delivery.update.mockResolvedValue({
        ...baseDelivery,
        status: 'SEARCHING_FOR_DRIVER',
        excludedDriverIds: ['driver-1'],
        assignmentAttempts: 2,
      });

      await service.rejectAssignment('delivery-1', 'driver-1', 'too far');

      expect(queue.cancelResponseTimeout).toHaveBeenCalledWith('delivery-1', 1);
      expect(prisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SEARCHING_FOR_DRIVER',
            excludedDriverIds: ['driver-1'],
            assignmentAttempts: 2,
          }),
        }),
      );
      expect(queue.enqueueAssignment).toHaveBeenCalledWith('delivery-1');
    });

    it('exhausts to FAILED when assignmentAttempts reaches the max', async () => {
      const nearlyExhausted = { ...baseDelivery, assignmentAttempts: 4 }; // MAX_ASSIGNMENT_ATTEMPTS assumed = 5
      prisma.delivery.findUnique.mockResolvedValue(nearlyExhausted);
      prisma.delivery.update.mockResolvedValue({ ...nearlyExhausted, status: 'FAILED' });

      await service.rejectAssignment('delivery-1', 'driver-1');

      expect(prisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
      );
      expect(queue.enqueueAssignment).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for a driver who is not assigned to this delivery', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery, driverId: 'someone-else' });
      await expect(service.rejectAssignment('delivery-1', 'driver-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when the delivery is not in DRIVER_ASSIGNED', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery, status: 'DRIVER_ACCEPTED' });
      await expect(service.rejectAssignment('delivery-1', 'driver-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  // ---- TIMEOUT ----

  describe('handleTimeout', () => {
    it('treats an unresponded, expired assignment the same as a rejection', async () => {
      prisma.delivery.findUnique.mockResolvedValue({ ...baseDelivery });
      prisma.delivery.update.mockResolvedValue({
        ...baseDelivery,
        status: 'SEARCHING_FOR_DRIVER',
        excludedDriverIds: ['driver-1'],
      });

      await service.handleTimeout('delivery-1', 'driver-1', 1);

      expect(prisma.deliveryStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ reason: 'TIMEOUT' }) }),
      );
      expect(queue.enqueueAssignment).toHaveBeenCalledWith('delivery-1');
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
    });

    it('is a no-op if the delivery no longer exists', async () => {
      prisma.delivery.findUnique.mockResolvedValue(null);
      await expect(service.handleTimeout('delivery-1', 'driver-1', 1)).resolves.toBeUndefined();
      expect(prisma.delivery.update).not.toHaveBeenCalled();
    });
  });
});
