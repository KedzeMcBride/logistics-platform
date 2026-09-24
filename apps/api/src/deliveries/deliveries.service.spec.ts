import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AssignmentService } from '../assignment';
import { DriversService } from '../drivers';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentQueueService } from '../queue';

import { DeliveriesService } from './deliveries.service';
import { PricingService } from './pricing.service';

describe('DeliveriesService (integration)', () => {
  let module: TestingModule;
  let service: DeliveriesService;
  let prisma: PrismaService;
  let customerUserId: string;
  let customerProfileId: string;

  const mockAssignmentQueue = {
    enqueueAssignment: jest.fn().mockResolvedValue(undefined),
  };

  const mockAssignmentService = {
    acceptAssignment: jest.fn(),
    rejectAssignment: jest.fn(),
  };

  const mockDriversService = {
    getMe: jest.fn(),
  };

  const CREATE_INPUT = {
    pickupAddress: '100 Test St',
    pickupLat: 39.78,
    pickupLng: -89.65,
    destinationAddress: '200 Dest Ave',
    destinationLat: 39.8,
    destinationLng: -89.64,
    packageDescription: 'Test package',
    packageSizeCategory: 'SMALL' as const,
    packageWeightKg: 1.5,
    priority: 'STANDARD' as const,
    recipientName: 'Test Recipient',
    recipientPhone: '+15551234567',
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] })],
      providers: [
        DeliveriesService,
        PricingService,
        PrismaService,
        { provide: AssignmentQueueService, useValue: mockAssignmentQueue },
        { provide: AssignmentService, useValue: mockAssignmentService },
        { provide: DriversService, useValue: mockDriversService },
      ],
    }).compile();

    service = module.get(DeliveriesService);
    prisma = module.get(PrismaService);
    await prisma.$connect();

    const user = await prisma.user.create({
      data: {
        email: `deliv-test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        role: 'CUSTOMER',
        customerProfile: { create: { fullName: 'Delivery Tester' } },
      },
      include: { customerProfile: true },
    });

    customerUserId = user.id;
    customerProfileId = user.customerProfile!.id;
  });

  afterEach(() => {
    mockAssignmentQueue.enqueueAssignment.mockClear();
    mockAssignmentQueue.enqueueAssignment.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await prisma.deliveryStatusHistory.deleteMany({
      where: { delivery: { customerId: customerProfileId } },
    });
    await prisma.delivery.deleteMany({ where: { customerId: customerProfileId } });
    await prisma.user.deleteMany({ where: { email: { contains: 'deliv-test-' } } });
    await prisma.$disconnect();
    await module.close();
  });

  describe('create + lifecycle', () => {
    it('creates a delivery in PENDING', async () => {
      const result = await service.create(customerUserId, CREATE_INPUT);
      expect(result.status).toBe('PENDING');
      expect(result.estimatedPrice).toBeDefined();
      expect(result.statusHistory).toHaveLength(1);
      expect(result.statusHistory[0]?.toStatus).toBe('PENDING');
    });

    it('confirms a PENDING delivery', async () => {
      const created = await service.create(customerUserId, CREATE_INPUT);
      const confirmed = await service.confirm(customerUserId, created.id);

      expect(confirmed.status).toBe('CONFIRMED');
      expect(confirmed.confirmedAt).toBeInstanceOf(Date);
      expect(confirmed.statusHistory).toHaveLength(2);
    });

    it('enqueues a driver-assignment job when a delivery is confirmed', async () => {
      const created = await service.create(customerUserId, CREATE_INPUT);
      await service.confirm(customerUserId, created.id);

      expect(mockAssignmentQueue.enqueueAssignment).toHaveBeenCalledWith(created.id);
    });

    it('still confirms the delivery even if the assignment queue is unreachable', async () => {
      mockAssignmentQueue.enqueueAssignment.mockRejectedValueOnce(
        new Error('connect ECONNREFUSED'),
      );

      const created = await service.create(customerUserId, CREATE_INPUT);
      const confirmed = await service.confirm(customerUserId, created.id);

      // Confirmation is not rolled back by a queue outage — it's a
      // best-effort side effect, same as the Redis geo-index sync pattern
      // used elsewhere in the codebase.
      expect(confirmed.status).toBe('CONFIRMED');
    });

    it('rejects confirming a non-PENDING delivery', async () => {
      const created = await service.create(customerUserId, CREATE_INPUT);
      await service.confirm(customerUserId, created.id);

      await expect(service.confirm(customerUserId, created.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('cancels a PENDING delivery', async () => {
      const created = await service.create(customerUserId, CREATE_INPUT);
      const cancelled = await service.cancel(customerUserId, created.id, { reason: 'test' });

      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.cancelledReason).toBe('test');
      expect(cancelled.cancelledAt).toBeInstanceOf(Date);
    });

    it('rejects cancel on DELIVERED', async () => {
      const created = await service.create(customerUserId, CREATE_INPUT);

      await prisma.delivery.update({
        where: { id: created.id },
        data: { status: 'DELIVERED' },
      });

      await expect(
        service.cancel(customerUserId, created.id, { reason: 'test' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('access control', () => {
    it('rejects detail access from a different customer', async () => {
      const created = await service.create(customerUserId, CREATE_INPUT);

      await expect(
        service.detail('00000000-0000-0000-0000-000000000000', 'CUSTOMER', created.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns 404 for a missing delivery', async () => {
      await expect(
        service.detail(customerUserId, 'CUSTOMER', '00000000-0000-0000-0000-000000000000'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects confirm from a different customer', async () => {
      const created = await service.create(customerUserId, CREATE_INPUT);

      await expect(
        service.confirm('00000000-0000-0000-0000-000000000000', created.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
