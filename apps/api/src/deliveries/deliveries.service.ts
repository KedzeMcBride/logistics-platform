import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DeliveryStatus } from '@prisma/client';
import { Role } from '@repo/shared';

import { PrismaService } from '../prisma/prisma.service';

import type {
  CancelDeliveryDto,
  CreateDeliveryDto,
  ListDeliveriesDto,
  QuoteDeliveryDto,
} from './dto';
import { PricingService } from './pricing.service';

const CANCELLABLE_STATUSES: DeliveryStatus[] = ['PENDING', 'CONFIRMED', 'SEARCHING_FOR_DRIVER'];

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async quote(dto: QuoteDeliveryDto) {
    const distanceKm = this.pricing.haversineKm(
      dto.pickupLat,
      dto.pickupLng,
      dto.destinationLat,
      dto.destinationLng,
    );
    const durationMin = this.pricing.estimateDurationMin(distanceKm);
    const pricing = this.pricing.calculate({
      distanceKm,
      weightKg: dto.packageWeightKg,
      priority: dto.priority,
    });

    return { distanceKm, durationMin, pricing };
  }

  async create(userId: string, dto: CreateDeliveryDto) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!customer) {
      throw new ForbiddenException('Only customers can create deliveries');
    }

    const distanceKm = this.pricing.haversineKm(
      dto.pickupLat,
      dto.pickupLng,
      dto.destinationLat,
      dto.destinationLng,
    );
    const durationMin = this.pricing.estimateDurationMin(distanceKm);
    const pricing = this.pricing.calculate({
      distanceKm,
      weightKg: dto.packageWeightKg,
      priority: dto.priority,
    });

    return this.prisma.delivery.create({
      data: {
        customerId: customer.id,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        destinationAddress: dto.destinationAddress,
        destinationLat: dto.destinationLat,
        destinationLng: dto.destinationLng,
        packageDescription: dto.packageDescription,
        packageSizeCategory: dto.packageSizeCategory,
        packageWeightKg: dto.packageWeightKg,
        priority: dto.priority,
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        notes: dto.notes,
        status: 'PENDING',
        estimatedDistanceKm: distanceKm,
        estimatedDurationMin: durationMin,
        estimatedPrice: pricing.total,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'PENDING',
            changedBy: userId,
            reason: 'Delivery created',
          },
        },
      },
      include: {
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async list(userId: string, role: Role, query: ListDeliveriesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = await this.buildScopeFilter(userId, role, query.status);

    const [items, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { statusHistory: { orderBy: { createdAt: 'asc' } } },
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async detail(userId: string, role: Role, deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (!(await this.canAccess(userId, role, delivery))) {
      throw new ForbiddenException('You cannot view this delivery');
    }

    return delivery;
  }

  async confirm(userId: string, deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { customer: true },
    });

    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.customer.userId !== userId) {
      throw new ForbiddenException('Not your delivery');
    }
    if (delivery.status !== 'PENDING') {
      throw new BadRequestException(`Cannot confirm a delivery in status ${delivery.status}`);
    }

    return this.transition(deliveryId, 'PENDING', 'CONFIRMED', userId, 'Customer confirmed');
  }

  async cancel(userId: string, deliveryId: string, dto: CancelDeliveryDto) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { customer: true },
    });

    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.customer.userId !== userId) {
      throw new ForbiddenException('Not your delivery');
    }
    if (!CANCELLABLE_STATUSES.includes(delivery.status)) {
      throw new BadRequestException(`Cannot cancel a delivery in status ${delivery.status}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'CANCELLED',
          cancelledById: userId,
          cancelledReason: dto.reason,
          cancelledAt: new Date(),
        },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: delivery.status,
          toStatus: 'CANCELLED',
          changedBy: userId,
          reason: dto.reason ?? 'Cancelled by customer',
        },
      });
    });

    return this.prisma.delivery.findUniqueOrThrow({
      where: { id: deliveryId },
      include: { statusHistory: { orderBy: { createdAt: 'asc' } } },
    });
  }

  private async buildScopeFilter(userId: string, role: Role, status?: DeliveryStatus) {
    const base: Record<string, unknown> = {};
    if (status) base.status = status;

    if (role === Role.CUSTOMER) {
      const customer = await this.prisma.customerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!customer) return { ...base, id: 'none' };
      return { ...base, customerId: customer.id };
    }

    if (role === Role.DRIVER) {
      const driver = await this.prisma.driverProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!driver) return { ...base, id: 'none' };
      return { ...base, driverId: driver.id };
    }

    return base;
  }

  private async canAccess(
    userId: string,
    role: Role,
    delivery: { customerId: string; driverId: string | null },
  ): Promise<boolean> {
    if (role === Role.ADMIN || role === Role.OPERATIONS_MANAGER) return true;

    if (role === Role.CUSTOMER) {
      const customer = await this.prisma.customerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      return customer?.id === delivery.customerId;
    }

    if (role === Role.DRIVER) {
      const driver = await this.prisma.driverProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      return driver?.id === delivery.driverId;
    }

    return false;
  }

  private async transition(
    deliveryId: string,
    from: DeliveryStatus,
    to: DeliveryStatus,
    actorId: string,
    reason: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: to,
          ...(to === 'CONFIRMED' ? { confirmedAt: new Date() } : {}),
        },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: from,
          toStatus: to,
          changedBy: actorId,
          reason,
        },
      });
    });

    return this.prisma.delivery.findUniqueOrThrow({
      where: { id: deliveryId },
      include: { statusHistory: { orderBy: { createdAt: 'asc' } } },
    });
  }
}
