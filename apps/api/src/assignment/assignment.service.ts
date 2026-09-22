import { Injectable, Logger } from '@nestjs/common';

import { DriversService } from '../drivers';
import { PrismaService } from '../prisma/prisma.service';

import {
  ASSIGNABLE_STATUSES,
  ASSIGNMENT_CANDIDATE_LIMIT,
  ASSIGNMENT_SEARCH_RADIUS_KM,
  ASSIGNMENT_SYSTEM_ACTOR,
} from './assignment.constants';
import { NoAvailableDriverError } from './no-available-driver.error';

export type AssignmentResult =
  | { outcome: 'assigned'; deliveryId: string; driverId: string }
  | { outcome: 'skipped'; deliveryId: string; reason: string };

type NearbyCandidate = Awaited<ReturnType<DriversService['findNearby']>>[number];

/**
 * Owns the "pick a driver for this delivery, and do it" domain operation —
 * the rule-based v1 assignment flow. Deliberately has no knowledge of
 * BullMQ or any other trigger; `AssignmentProcessor` (the queue worker) is
 * a thin adapter over this service, and any future caller (a manual
 * "reassign" admin action, a backfill script, etc.) can call
 * `assignDriver` directly.
 *
 * v1 rule: nearest ONLINE driver (via `DriversService.findNearby`, Day 13's
 * Redis GEOSEARCH + Postgres cross-check) whose active vehicle can carry
 * the package's declared weight. A vehicle with no declared capacity is
 * treated as eligible — `capacityKg` is optional at vehicle creation, and
 * a driver who simply never filled it in should not be silently excluded
 * from every assignment.
 */
@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly drivers: DriversService,
  ) {}

  async assignDriver(deliveryId: string): Promise<AssignmentResult> {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });

    if (!delivery) {
      return { outcome: 'skipped', deliveryId, reason: 'Delivery no longer exists' };
    }

    if (!ASSIGNABLE_STATUSES.has(delivery.status)) {
      return {
        outcome: 'skipped',
        deliveryId,
        reason: `Delivery is ${delivery.status}, not assignable`,
      };
    }

    if (delivery.status === 'CONFIRMED') {
      await this.markSearching(deliveryId);
    }

    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { assignmentAttempts: { increment: 1 } },
    });

    const candidates = await this.drivers.findNearby({
      lat: delivery.pickupLat,
      lng: delivery.pickupLng,
      radiusKm: ASSIGNMENT_SEARCH_RADIUS_KM,
      limit: ASSIGNMENT_CANDIDATE_LIMIT,
    });

    const chosen = this.selectDriver(candidates, delivery.packageWeightKg);
    if (!chosen) {
      throw new NoAvailableDriverError(deliveryId, ASSIGNMENT_SEARCH_RADIUS_KM);
    }

    await this.assign(deliveryId, chosen.driverId);
    this.logger.log(`Assigned driver ${chosen.driverId} to delivery ${deliveryId}`);

    return { outcome: 'assigned', deliveryId, driverId: chosen.driverId };
  }

  /**
   * Gives up on assignment: moves the delivery to FAILED. Callers (the
   * queue worker, on retry exhaustion) decide *when* to give up; this just
   * performs it safely. Guards against clobbering a delivery that moved on
   * for an unrelated reason (customer cancelled, an earlier retry already
   * succeeded) while the caller was still deciding whether to give up — it
   * only fails a delivery that is still actually SEARCHING_FOR_DRIVER.
   */
  async markFailed(deliveryId: string, reason: string): Promise<void> {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.status !== 'SEARCHING_FOR_DRIVER') return;

    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: { status: 'FAILED' },
      });
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: 'SEARCHING_FOR_DRIVER',
          toStatus: 'FAILED',
          changedBy: ASSIGNMENT_SYSTEM_ACTOR,
          reason: `Driver assignment exhausted all retries: ${reason}`,
        },
      });
    });
  }

  /**
   * Applies the v1 rule to a candidate list: nearest first (candidates are
   * already sorted that way by `findNearby`), filtered down to drivers with
   * at least one active vehicle that can carry the package.
   */
  private selectDriver(
    candidates: NearbyCandidate[],
    packageWeightKg: number,
  ): NearbyCandidate | undefined {
    return candidates.find((candidate) =>
      candidate.vehicles.some(
        (vehicle) => vehicle.capacityKg === null || vehicle.capacityKg >= packageWeightKg,
      ),
    );
  }

  private async markSearching(deliveryId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: { status: 'SEARCHING_FOR_DRIVER' },
      });
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: 'CONFIRMED',
          toStatus: 'SEARCHING_FOR_DRIVER',
          changedBy: ASSIGNMENT_SYSTEM_ACTOR,
          reason: 'Assignment started searching for a driver',
        },
      });
    });
  }

  private async assign(deliveryId: string, driverId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: { driverId, status: 'DRIVER_ASSIGNED' },
      });
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: 'SEARCHING_FOR_DRIVER',
          toStatus: 'DRIVER_ASSIGNED',
          changedBy: ASSIGNMENT_SYSTEM_ACTOR,
          reason: `Auto-assigned to driver ${driverId}`,
        },
      });
    });
  }
}
