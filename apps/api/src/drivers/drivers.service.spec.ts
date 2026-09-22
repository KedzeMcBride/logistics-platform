import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

import { DriversService } from './drivers.service';

describe('DriversService (integration)', () => {
  let module: TestingModule;
  let service: DriversService;
  let prisma: PrismaService;
  let redisGeoadd: jest.Mock;
  let redisZrem: jest.Mock;

  let approvedDriverUserId: string;
  let approvedDriverId: string;
  let unapprovedDriverUserId: string;
  let noVehicleDriverUserId: string;

  const mockRedisService = {
    client: {
      geoadd: jest.fn().mockResolvedValue(1),
      zrem: jest.fn().mockResolvedValue(1),
    },
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] })],
      providers: [
        DriversService,
        PrismaService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get(DriversService);
    prisma = module.get(PrismaService);
    redisGeoadd = mockRedisService.client.geoadd;
    redisZrem = mockRedisService.client.zrem;
    await prisma.$connect();

    // Approved driver, with one active vehicle — eligible to go ONLINE.
    const approvedUser = await prisma.user.create({
      data: {
        email: `driver-test-approved-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        role: 'DRIVER',
        driverProfile: {
          create: {
            fullName: 'Approved Driver',
            approvalStatus: 'APPROVED',
          },
        },
      },
      include: { driverProfile: true },
    });
    approvedDriverUserId = approvedUser.id;
    approvedDriverId = approvedUser.driverProfile!.id;

    await prisma.vehicle.create({
      data: {
        driverId: approvedDriverId,
        type: 'CAR',
        plateNumber: `LT-${Date.now()}`,
        isActive: true,
      },
    });

    // Approved driver, no active vehicle — not eligible to go ONLINE.
    const noVehicleUser = await prisma.user.create({
      data: {
        email: `driver-test-novehicle-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        role: 'DRIVER',
        driverProfile: {
          create: {
            fullName: 'No Vehicle Driver',
            approvalStatus: 'APPROVED',
          },
        },
      },
    });
    noVehicleDriverUserId = noVehicleUser.id;

    // Unapproved driver — not eligible to go ONLINE regardless of vehicles.
    const unapprovedUser = await prisma.user.create({
      data: {
        email: `driver-test-unapproved-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        role: 'DRIVER',
        driverProfile: {
          create: {
            fullName: 'Unapproved Driver',
            approvalStatus: 'PENDING',
          },
        },
      },
    });
    unapprovedDriverUserId = unapprovedUser.id;
  });

  afterEach(() => {
    redisGeoadd.mockClear();
    redisZrem.mockClear();
  });

  afterAll(async () => {
    await prisma.vehicle.deleteMany({ where: { driverId: approvedDriverId } });
    await prisma.user.deleteMany({ where: { email: { contains: 'driver-test-' } } });
    await prisma.$disconnect();
    await module.close();
  });

  describe('setAvailability', () => {
    it('rejects going ONLINE when the driver is not approved', async () => {
      await expect(
        service.setAvailability(unapprovedDriverUserId, { availability: 'ONLINE' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects going ONLINE when the driver has no active vehicle', async () => {
      await expect(
        service.setAvailability(noVehicleDriverUserId, { availability: 'ONLINE' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a non-driver account', async () => {
      await expect(
        service.setAvailability('00000000-0000-0000-0000-000000000000', {
          availability: 'ONLINE',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('goes ONLINE without a location and removes the driver from the geo index', async () => {
      // Runs first, while this driver has no location on file yet — a
      // realistic "never reported GPS" state. Without a *known* location the
      // driver cannot be placed in the geo index, so they're kept out of it.
      const updated = await service.setAvailability(approvedDriverUserId, {
        availability: 'ONLINE',
      });

      expect(updated.availability).toBe('ONLINE');
      expect(redisZrem).toHaveBeenCalledWith('driver:locations', approvedDriverId);
      expect(redisGeoadd).not.toHaveBeenCalled();
    });

    it('goes ONLINE with a fresh location and syncs the Redis geo index', async () => {
      const updated = await service.setAvailability(approvedDriverUserId, {
        availability: 'ONLINE',
        lat: 4.1591,
        lng: 9.2417,
      });

      expect(updated.availability).toBe('ONLINE');
      expect(updated.currentLat).toBeCloseTo(4.1591);
      expect(updated.currentLng).toBeCloseTo(9.2417);
      expect(updated.lastLocationAt).toBeInstanceOf(Date);
      expect(redisGeoadd).toHaveBeenCalledWith(
        'driver:locations',
        9.2417,
        4.1591,
        approvedDriverId,
      );
    });

    it('going OFFLINE removes the driver from the geo index', async () => {
      await service.setAvailability(approvedDriverUserId, {
        availability: 'ONLINE',
        lat: 4.05,
        lng: 9.7,
      });
      redisZrem.mockClear();

      const updated = await service.setAvailability(approvedDriverUserId, {
        availability: 'OFFLINE',
      });

      expect(updated.availability).toBe('OFFLINE');
      expect(redisZrem).toHaveBeenCalledWith('driver:locations', approvedDriverId);
    });
  });

  describe('updateLocation', () => {
    it('persists a new location and updates lastLocationAt', async () => {
      const before = await prisma.driverProfile.findUniqueOrThrow({
        where: { id: approvedDriverId },
      });

      const updated = await service.updateLocation(approvedDriverUserId, {
        lat: 3.848,
        lng: 11.5021,
      });

      expect(updated.currentLat).toBeCloseTo(3.848);
      expect(updated.currentLng).toBeCloseTo(11.5021);
      expect(updated.lastLocationAt?.getTime()).toBeGreaterThanOrEqual(
        before.lastLocationAt?.getTime() ?? 0,
      );
    });

    it('syncs the geo index only while the driver is ONLINE', async () => {
      await service.setAvailability(approvedDriverUserId, { availability: 'OFFLINE' });
      redisGeoadd.mockClear();
      redisZrem.mockClear();

      await service.updateLocation(approvedDriverUserId, { lat: 4.0, lng: 9.0 });

      expect(redisGeoadd).not.toHaveBeenCalled();
      expect(redisZrem).toHaveBeenCalledWith('driver:locations', approvedDriverId);
    });

    it('rejects a non-driver account', async () => {
      await expect(
        service.updateLocation('00000000-0000-0000-0000-000000000000', { lat: 4.0, lng: 9.0 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
