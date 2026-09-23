/**
 * Day 16 — worker tests for AssignmentTimeoutProcessor.
 * Mirrors the mocking style of the existing assignment.processor.spec.ts
 * from Day 14 (mocked PrismaService, mocked AssignmentService).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentTimeoutProcessor } from './assignment-timeout.processor';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentService } from '../assignment/assignment.service';

describe('AssignmentTimeoutProcessor', () => {
  let processor: AssignmentTimeoutProcessor;
  let prisma: { delivery: { findUnique: jest.Mock } };
  let assignmentService: { handleTimeout: jest.Mock };

  const job = (data: object) => ({ data }) as any;

  beforeEach(async () => {
    prisma = { delivery: { findUnique: jest.fn() } };
    assignmentService = { handleTimeout: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentTimeoutProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: AssignmentService, useValue: assignmentService },
      ],
    }).compile();

    processor = module.get(AssignmentTimeoutProcessor);
  });

  it('calls handleTimeout when the driver has not responded and the deadline has passed', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 'd1',
      status: 'DRIVER_ASSIGNED',
      driverId: 'driver-1',
      driverRespondedAt: null,
      driverResponseDeadline: new Date(Date.now() - 1000),
    });

    await processor.process(job({ deliveryId: 'd1', driverId: 'driver-1', attempt: 1 }));

    expect(assignmentService.handleTimeout).toHaveBeenCalledWith('d1', 'driver-1', 1);
  });

  it('is a no-op if the delivery no longer exists', async () => {
    prisma.delivery.findUnique.mockResolvedValue(null);
    await processor.process(job({ deliveryId: 'gone', driverId: 'driver-1', attempt: 1 }));
    expect(assignmentService.handleTimeout).not.toHaveBeenCalled();
  });

  it('is a no-op if the driver already responded', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 'd1',
      status: 'DRIVER_ASSIGNED',
      driverId: 'driver-1',
      driverRespondedAt: new Date(),
      driverResponseDeadline: new Date(Date.now() - 1000),
    });

    await processor.process(job({ deliveryId: 'd1', driverId: 'driver-1', attempt: 1 }));
    expect(assignmentService.handleTimeout).not.toHaveBeenCalled();
  });

  it('is a no-op if the delivery status changed (e.g. customer cancelled)', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 'd1',
      status: 'CANCELLED',
      driverId: 'driver-1',
      driverRespondedAt: null,
      driverResponseDeadline: new Date(Date.now() - 1000),
    });

    await processor.process(job({ deliveryId: 'd1', driverId: 'driver-1', attempt: 1 }));
    expect(assignmentService.handleTimeout).not.toHaveBeenCalled();
  });

  it('is a no-op if a different driver is now assigned (superseded by a later attempt)', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 'd1',
      status: 'DRIVER_ASSIGNED',
      driverId: 'driver-2',
      driverRespondedAt: null,
      driverResponseDeadline: new Date(Date.now() - 1000),
    });

    await processor.process(job({ deliveryId: 'd1', driverId: 'driver-1', attempt: 1 }));
    expect(assignmentService.handleTimeout).not.toHaveBeenCalled();
  });

  it('is a no-op if the deadline has not actually passed yet (defensive race guard)', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 'd1',
      status: 'DRIVER_ASSIGNED',
      driverId: 'driver-1',
      driverRespondedAt: null,
      driverResponseDeadline: new Date(Date.now() + 30_000),
    });

    await processor.process(job({ deliveryId: 'd1', driverId: 'driver-1', attempt: 1 }));
    expect(assignmentService.handleTimeout).not.toHaveBeenCalled();
  });
});
