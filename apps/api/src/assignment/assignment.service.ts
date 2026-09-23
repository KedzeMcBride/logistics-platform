import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DriversService } from '../drivers/drivers.service';
import { ASSIGNMENT_RESPONSE_TIMEOUT_MS } from '../queue/constants';

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
 * the rule-based v1 assignment flow. Deliberately has no knowledge of BullMQ
 * or any other trigger; `AssignmentProcessor` (the queue worker) is a thin
 * adapter over this service, and any future caller (a manual "reassign"
 * admin action, a backfill script, etc.) can call `assignDriver` directly.
 *
 * v1 rule: nearest ONLINE driver (via `DriversService.findNearby`, Day 13's
 * Redis GEOSEARCH + Postgres cross-check) whose active vehicle can carry the
 * package's declared weight. A vehicle with no declared capacity is treated
 * as eligible — `capacityKg` is optional at vehicle creation, and a driver
 * who simply never filled it in should not be silently excluded from every
 * assignment.
 */
@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly drivers: DriversService,
  ) {}

  async assignDriver(deliveryId: string): Promise<AssignmentResult> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      return {
        outcome: 'skipped',
        deliveryId,
        reason: 'Delivery no longer exists',
      };
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

    return {
      outcome: 'assigned',
      deliveryId,
      driverId: chosen.driverId,
    };
  }

  /**
   * Handles a driver failing to respond within the assignment deadline.
   *
   * The timeout worker has already verified that this delivery is still
   * assigned to the same driver and that the response deadline has passed.
   * We re-check the state here because the delivery may have changed between
   * the worker's initial read and this method being executed.
   *
   * Once confirmed as a genuine timeout, the delivery is returned to
   * SEARCHING_FOR_DRIVER and the existing assignment flow is invoked again.
   */
  async handleTimeout(deliveryId: string, driverId: string, attempt: number): Promise<void> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      this.logger.warn(`Timeout handling skipped: delivery ${deliveryId} no longer exists`);
      return;
    }

    // Re-check the assignment state before changing anything.
    if (
      delivery.status !== 'DRIVER_ASSIGNED' ||
      delivery.driverId !== driverId ||
      delivery.driverRespondedAt
    ) {
      return;
    }

    await this.returnToSearching(
      deliveryId,
      driverId,
      `Driver ${driverId} timed out responding to assignment attempt ${attempt}`,
    );

    this.logger.log(
      `Driver ${driverId} timed out for delivery ${deliveryId}; searching for another driver`,
    );

    await this.reassignOrFail(deliveryId);
  }

  /**
   * Driver accepts an offered delivery. Only the currently-assigned driver,
   * only while the delivery is DRIVER_ASSIGNED and before the deadline.
   * (The deadline check here is a courtesy to the driver — if the timeout
   * worker's job hasn't fired yet due to delay-queue jitter, we still treat
   * an expired deadline as already-timed-out rather than letting a late
   * accept slip through and race the timeout worker.)
   */
  async acceptAssignment(deliveryId: string, driverId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    if (delivery.driverId !== driverId) {
      throw new ForbiddenException('This delivery is not assigned to you');
    }
    if (delivery.status !== 'DRIVER_ASSIGNED') {
      throw new BadRequestException(`Cannot accept a delivery in status ${delivery.status}`);
    }
    if (delivery.driverResponseDeadline && delivery.driverResponseDeadline < new Date()) {
      throw new BadRequestException('The response window for this delivery has expired');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { status: 'DRIVER_ACCEPTED', driverRespondedAt: new Date() },
      }),
      this.prisma.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: 'DRIVER_ASSIGNED',
          toStatus: 'DRIVER_ACCEPTED',
          changedBy: driverId,
          reason: 'Driver accepted the assignment',
        },
      }),
    ]);

    this.logger.log(`Driver ${driverId} accepted delivery ${deliveryId}`);

    // No queue-cancellation call needed: handleTimeout already re-checks
    // `driverRespondedAt` before acting, so a stale timeout job that fires
    // after this is a guaranteed no-op — same idempotency guard the
    // existing timeout path relies on.
    return updated;
  }

  /**
   * Driver rejects an offered delivery. Reuses the exact same
   * SEARCHING_FOR_DRIVER → reassign-or-fail path as handleTimeout — a
   * rejection and a timeout are both "this driver did not take the
   * delivery," differing only in who triggered it and the history reason.
   */
  async rejectAssignment(deliveryId: string, driverId: string, reason?: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    if (delivery.driverId !== driverId) {
      throw new ForbiddenException('This delivery is not assigned to you');
    }
    if (delivery.status !== 'DRIVER_ASSIGNED') {
      throw new BadRequestException(`Cannot reject a delivery in status ${delivery.status}`);
    }

    await this.returnToSearching(
      deliveryId,
      driverId,
      `Driver ${driverId} rejected the assignment${reason ? `: ${reason}` : ''}`,
    );

    this.logger.log(`Driver ${driverId} rejected delivery ${deliveryId}`);

    await this.reassignOrFail(deliveryId);

    return { deliveryId, status: 'reassignment-triggered' as const };
  }

  /**
   * Shared by handleTimeout and rejectAssignment: moves a DRIVER_ASSIGNED
   * delivery back to SEARCHING_FOR_DRIVER, clearing the assignment fields.
   */
  private async returnToSearching(
    deliveryId: string,
    driverId: string,
    historyReason: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'SEARCHING_FOR_DRIVER',
          driverId: null,
          driverResponseDeadline: null,
          driverRespondedAt: null,
        },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId,
          fromStatus: 'DRIVER_ASSIGNED',
          toStatus: 'SEARCHING_FOR_DRIVER',
          changedBy: driverId,
          reason: historyReason,
        },
      });
    });
  }

  /**
   * Shared by handleTimeout and rejectAssignment: try to find another
   * driver immediately; give up to FAILED via the existing markFailed path
   * if none are available. Identical to the retry behavior handleTimeout
   * already had before accept/reject existed — just factored out so reject
   * doesn't duplicate it.
   */
  private async reassignOrFail(deliveryId: string): Promise<void> {
    try {
      await this.assignDriver(deliveryId);
    } catch (error) {
      if (error instanceof NoAvailableDriverError) {
        await this.markFailed(deliveryId, error.message);
        return;
      }
      throw error;
    }
  }

  /**
   * Gives up on assignment: moves the delivery to FAILED. Callers (the
   * queue worker, on retry exhaustion) decide when to give up; this just
   * performs it safely.
   *
   * Guards against clobbering a delivery that moved on for an unrelated
   * reason (customer cancelled, an earlier retry already succeeded) while
   * the caller was still deciding whether to give up — it only fails a
   * delivery that is still actually SEARCHING_FOR_DRIVER.
   */
  async markFailed(deliveryId: string, reason: string): Promise<void> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.status !== 'SEARCHING_FOR_DRIVER') {
      return;
    }

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
    // NOTE: driverResponseDeadline is set here as the Day 16 fix — VERIFY
    // this isn't ALSO being set in assignment.processor.ts right after
    // calling assignDriver(), or a delivery could get a deadline computed
    // twice (harmless) or, worse, overwritten with a different clock read.
    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          driverId,
          status: 'DRIVER_ASSIGNED',
          driverResponseDeadline: new Date(Date.now() + ASSIGNMENT_RESPONSE_TIMEOUT_MS),
          driverRespondedAt: null,
        },
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
