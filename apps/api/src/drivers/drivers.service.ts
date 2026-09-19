import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

import type {
  AddDocumentDto,
  AddVehicleDto,
  SetAvailabilityDto,
  UpdateVehicleDto,
} from './dto';

const DRIVER_GEO_KEY = 'driver:locations';

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

    const updated = await this.prisma.driverProfile.update({
      where: { id: driver.id },
      data: {
        availability: dto.availability,
        lastLocationAt: dto.availability === 'ONLINE' ? new Date() : undefined,
      },
    });

    // Sync Redis geo index
    try {
      if (dto.availability === 'ONLINE') {
        // Placeholder location until real GPS updates arrive on Day 15
        const lat = driver.currentLat ?? 0;
        const lng = driver.currentLng ?? 0;
        if (lat !== 0 && lng !== 0) {
          await this.redis.client.geoadd(DRIVER_GEO_KEY, lng, lat, driver.id);
        }
      } else {
        await this.redis.client.zrem(DRIVER_GEO_KEY, driver.id);
      }
    } catch {
      // Redis failure shouldn't block the DB update
    }

    return updated;
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