import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
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
  let redisGeosearch: jest.Mock;

  let approvedDriverUserId: string;
  let approvedDriverId: string;
  let unapprovedDriverUserId: string;
  let noVehicleDriverUserId: string;
  let noVehicleDriverId: string;

  const mockRedisService = {
    client: {
      geoadd: jest.fn().mockResolvedValue(1),
      zrem: jest.fn().mockResolvedValue(1),
      geosearch: jest.fn(),
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
    redisGeosearch = mockRedisService.client.geosearch;
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
      include: { driverProfile: true },
    });
    noVehicleDriverUserId = noVehicleUser.id;
    noVehicleDriverId = noVehicleUser.driverProfile!.id;

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
    redisGeosearch.mockReset();
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

  describe('findNearby', () => {
    beforeAll(async () => {
      // Don't rely on whatever state earlier describe blocks left this
      // driver in — pin it explicitly so these tests are self-contained.
      await service.setAvailability(approvedDriverUserId, {
        availability: 'ONLINE',
        lat: 4.1591,
        lng: 9.2417,
      });
    });

    it('returns matched drivers, nearest first, with active vehicles included', async () => {
      redisGeosearch.mockResolvedValue([
        [approvedDriverId, '0.2133', ['9.24169868230819702', '4.15910101638305463']],
      ]);

      const results = await service.findNearby({ lat: 4.16, lng: 9.24 });

      expect(redisGeosearch).toHaveBeenCalledWith(
        'driver:locations',
        'FROMLONLAT',
        9.24,
        4.16,
        'BYRADIUS',
        5, // default radiusKm
        'km',
        'ASC',
        'COUNT',
        20, // default limit
        'WITHCOORD',
        'WITHDIST',
      );

      expect(results).toHaveLength(1);
      expect(results[0]!).toMatchObject({
        driverId: approvedDriverId,
        fullName: 'Approved Driver',
        distanceKm: 0.2133,
      });
      expect(results[0]!.vehicles.length).toBeGreaterThan(0);
    });

    it('respects a custom radius and limit', async () => {
      redisGeosearch.mockResolvedValue([]);

      await service.findNearby({ lat: 4.16, lng: 9.24, radiusKm: 2, limit: 5 });

      expect(redisGeosearch).toHaveBeenCalledWith(
        'driver:locations',
        'FROMLONLAT',
        9.24,
        4.16,
        'BYRADIUS',
        2,
        'km',
        'ASC',
        'COUNT',
        5,
        'WITHCOORD',
        'WITHDIST',
      );
    });

    it('returns an empty array when nothing is nearby', async () => {
      redisGeosearch.mockResolvedValue([]);

      const results = await service.findNearby({ lat: 4.16, lng: 9.24 });

      expect(results).toEqual([]);
    });

    it('filters out a stale index entry whose driver is no longer ONLINE in the database', async () => {
      // Simulates a Redis entry that wasn't cleaned up (e.g. a transient
      // zrem failure) — the driver is present in the geo index but is
      // actually OFFLINE (and has no vehicle) in Postgres, which remains
      // the source of truth.
      redisGeosearch.mockResolvedValue([
        [approvedDriverId, '0.5', ['9.24', '4.16']],
        [noVehicleDriverId, '0.8', ['9.25', '4.17']],
      ]);

      const results = await service.findNearby({ lat: 4.16, lng: 9.24 });

      expect(results).toHaveLength(1);
      expect(results[0]!.driverId).toBe(approvedDriverId);
    });

    it('surfaces a clear error when Redis is unavailable', async () => {
      redisGeosearch.mockRejectedValue(new Error('connection refused'));

      await expect(service.findNearby({ lat: 4.16, lng: 9.24 })).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
