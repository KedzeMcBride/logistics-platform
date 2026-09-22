import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

import type {
  AddDocumentDto,
  AddVehicleDto,
  NearbyDriversQueryDto,
  SetAvailabilityDto,
  UpdateLocationDto,
  UpdateVehicleDto,
} from './dto';

const DRIVER_GEO_KEY = 'driver:locations';

type NearbyMatch = {
  driverId: string;
  distanceKm: number;
  lat: number;
  lng: number;
};

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ---------------------------------------------------------------------------
  // Own profile
  // ---------------------------------------------------------------------------

  async getMe(userId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        vehicles: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        user: { select: { email: true, phone: true, isActive: true, isSuspended: true } },
      },
    });

    if (!driver) throw new NotFoundException('Driver profile not found');
    return driver;
  }

  // ---------------------------------------------------------------------------
  // Documents
  // ---------------------------------------------------------------------------

  async addDocument(userId: string, dto: AddDocumentDto) {
    const driver = await this.getDriverOrThrow(userId);

    // Prevent duplicate document types that are still pending or approved
    const existing = await this.prisma.driverDocument.findFirst({
      where: {
        driverId: driver.id,
        type: dto.type,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existing) {
      throw new BadRequestException(`A ${dto.type} document already exists`);
    }

    return this.prisma.driverDocument.create({
      data: {
        driverId: driver.id,
        type: dto.type,
        fileUrl: dto.fileUrl,
        status: 'PENDING',
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Vehicles
  // ---------------------------------------------------------------------------

  async addVehicle(userId: string, dto: AddVehicleDto) {
    const driver = await this.getDriverOrThrow(userId);

    return this.prisma.vehicle.create({
      data: {
        driverId: driver.id,
        type: dto.type,
        plateNumber: dto.plateNumber,
        capacityKg: dto.capacityKg,
        isActive: true,
      },
    });
  }

  async updateVehicle(userId: string, vehicleId: string, dto: UpdateVehicleDto) {
    const driver = await this.getDriverOrThrow(userId);

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, driverId: driver.id },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...(dto.plateNumber !== undefined ? { plateNumber: dto.plateNumber } : {}),
        ...(dto.capacityKg !== undefined ? { capacityKg: dto.capacityKg } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteVehicle(userId: string, vehicleId: string) {
    const driver = await this.getDriverOrThrow(userId);

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, driverId: driver.id },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    // Soft delete — deactivate instead of removing
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { isActive: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Availability
  // ---------------------------------------------------------------------------

  async setAvailability(userId: string, dto: SetAvailabilityDto) {
    const driver = await this.getDriverOrThrow(userId);

    if (dto.availability === 'ONLINE') {
      if (driver.approvalStatus !== 'APPROVED') {
        throw new BadRequestException('Your account is not approved yet');
      }
      const hasVehicle = await this.prisma.vehicle.count({
        where: { driverId: driver.id, isActive: true },
      });
      if (hasVehicle === 0) {
        throw new BadRequestException('Add an active vehicle before going online');
      }
    }

    const goingOnline = dto.availability === 'ONLINE';
    const hasFreshLocation = dto.lat !== undefined && dto.lng !== undefined;

    const updated = await this.prisma.driverProfile.update({
      where: { id: driver.id },
      data: {
        availability: dto.availability,
        ...(hasFreshLocation
          ? { currentLat: dto.lat, currentLng: dto.lng, lastLocationAt: new Date() }
          : {}),
      },
    });

    await this.syncGeoIndex(driver.id, goingOnline, updated.currentLat, updated.currentLng);

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Location
  // ---------------------------------------------------------------------------

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const driver = await this.getDriverOrThrow(userId);

    const updated = await this.prisma.driverProfile.update({
      where: { id: driver.id },
      data: {
        currentLat: dto.lat,
        currentLng: dto.lng,
        lastLocationAt: new Date(),
      },
    });

    await this.syncGeoIndex(driver.id, updated.availability === 'ONLINE', dto.lat, dto.lng);

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Nearby search
  // ---------------------------------------------------------------------------

  /**
   * Finds ONLINE drivers within `radiusKm` of a point, nearest first.
   *
   * Redis (`GEOSEARCH` against the `driver:locations` index maintained by
   * `syncGeoIndex`) does the geospatial scan — that's the fast path this
   * index exists for. Postgres remains the source of truth for who is
   * actually still online: an index entry can go stale (e.g. a driver went
   * offline while a `zrem` transiently failed — see `syncGeoIndex`), so the
   * matched IDs are re-checked against `driverProfile.availability` before
   * being returned. A driver dropped by that check simply doesn't appear in
   * the results; it isn't an error.
   */
  async findNearby(query: NearbyDriversQueryDto) {
    const radiusKm = query.radiusKm ?? 5;
    const limit = query.limit ?? 20;

    let matches: NearbyMatch[];
    try {
      const raw = await this.redis.client.geosearch(
        DRIVER_GEO_KEY,
        'FROMLONLAT',
        query.lng,
        query.lat,
        'BYRADIUS',
        radiusKm,
        'km',
        'ASC',
        'COUNT',
        limit,
        'WITHCOORD',
        'WITHDIST',
      );
      matches = this.parseGeosearchResults(raw);
    } catch {
      throw new ServiceUnavailableException('Unable to search for nearby drivers right now');
    }

    if (matches.length === 0) return [];

    const drivers = await this.prisma.driverProfile.findMany({
      where: {
        id: { in: matches.map((m) => m.driverId) },
        availability: 'ONLINE',
      },
      include: {
        vehicles: { where: { isActive: true } },
      },
    });
    const driverById = new Map(drivers.map((driver) => [driver.id, driver]));

    // `matches` is already nearest-first from GEOSEARCH ASC; filtering
    // preserves that order.
    return matches
      .filter((match) => driverById.has(match.driverId))
      .map((match) => {
        const driver = driverById.get(match.driverId)!;
        return {
          driverId: driver.id,
          fullName: driver.fullName,
          rating: driver.rating,
          distanceKm: match.distanceKm,
          lat: match.lat,
          lng: match.lng,
          vehicles: driver.vehicles.map((vehicle) => ({
            type: vehicle.type,
            plateNumber: vehicle.plateNumber,
            capacityKg: vehicle.capacityKg,
          })),
        };
      });
  }

  private parseGeosearchResults(raw: unknown): NearbyMatch[] {
    if (!Array.isArray(raw)) return [];

    return raw.map((entry) => {
      const [driverId, distance, coords] = entry as [string, string, [string, string]];
      const [lng, lat] = coords;
      return {
        driverId,
        distanceKm: Number(distance),
        lat: Number(lat),
        lng: Number(lng),
      };
    });
  }

  /**
   * Keeps the Redis geo index in sync with a driver's current online/offline
   * state and known location. Drivers are only discoverable for nearby
   * searches while ONLINE and while a real location is on file; otherwise
   * they are removed from the index.
   */
  private async syncGeoIndex(
    driverId: string,
    isOnline: boolean,
    lat: number | null,
    lng: number | null,
  ): Promise<void> {
    try {
      if (isOnline && lat !== null && lng !== null) {
        await this.redis.client.geoadd(DRIVER_GEO_KEY, lng, lat, driverId);
      } else {
        await this.redis.client.zrem(DRIVER_GEO_KEY, driverId);
      }
    } catch {
      // Redis failure shouldn't block the DB update
    }
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  async listPendingApprovals() {
    return this.prisma.driverProfile.findMany({
      where: { approvalStatus: 'PENDING' },
      include: {
        user: { select: { email: true, phone: true, createdAt: true } },
        vehicles: { where: { isActive: true } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listAllDrivers(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.driverProfile.findMany({
      where: status ? { approvalStatus: status } : {},
      include: {
        user: { select: { email: true, phone: true, isActive: true, isSuspended: true } },
        vehicles: { where: { isActive: true } },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(driverId: string, adminUserId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
      include: { documents: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const allApproved = driver.documents.every((d) => d.status === 'APPROVED');
    if (!allApproved) {
      throw new BadRequestException('All documents must be approved first');
    }

    const updated = await this.prisma.driverProfile.update({
      where: { id: driverId },
      data: { approvalStatus: 'APPROVED' },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: 'DRIVER_APPROVED',
        entityType: 'DriverProfile',
        entityId: driverId,
        metadata: { previousStatus: driver.approvalStatus },
      },
    });

    return updated;
  }

  async reject(driverId: string, adminUserId: string, reason: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const updated = await this.prisma.driverProfile.update({
      where: { id: driverId },
      data: { approvalStatus: 'REJECTED' },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: 'DRIVER_REJECTED',
        entityType: 'DriverProfile',
        entityId: driverId,
        metadata: { reason },
      },
    });

    return updated;
  }

  async approveDocument(documentId: string, adminUserId: string) {
    const doc = await this.prisma.driverDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });
  }

  async rejectDocument(documentId: string, adminUserId: string) {
    const doc = await this.prisma.driverDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async getDriverOrThrow(userId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (!driver) throw new ForbiddenException('Not a driver account');
    return driver;
  }
}
