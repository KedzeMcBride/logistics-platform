import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { DriversService } from '../drivers';
import { PrismaService } from '../prisma/prisma.service';

import type { AssignmentJobData } from './assignment-queue.service';
import {
  ASSIGNMENT_CANDIDATE_LIMIT,
  ASSIGNMENT_QUEUE_NAME,
  ASSIGNMENT_SEARCH_RADIUS_KM,
} from './constants';

/** Statuses from which this worker is allowed to pick up a delivery. */
const ASSIGNABLE_STATUSES = new Set(['CONFIRMED', 'SEARCHING_FOR_DRIVER']);

const SYSTEM_ACTOR = 'system:assignment-queue';

/**
 * Consumes `driver-assignment` jobs enqueued by `AssignmentQueueService`
 * (currently triggered from `DeliveriesService.confirm`).
 *
 * Flow per job:
 *  1. Re-check the delivery is still in an assignable status (it may have
 *     been cancelled, or already assigned by an earlier retry, while this
 *     job sat in the queue).
 *  2. Move CONFIRMED -> SEARCHING_FOR_DRIVER on the first attempt.
 *  3. Look for the nearest ONLINE driver via the existing Day 13 nearby
 *     query (Redis GEOSEARCH, cross-checked against Postgres).
 *  4. Assign the nearest match, or throw so BullMQ retries with backoff.
 *
 * `onFailed` only acts once the job's attempts are exhausted, transitioning
 * the delivery to FAILED so it doesn't stay stuck in SEARCHING_FOR_DRIVER
 * forever.
 */
@Processor(ASSIGNMENT_QUEUE_NAME)
export class AssignmentProcessor extends WorkerHost {
  private readonly logger = new Logger(AssignmentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly drivers: DriversService,
  ) {
    super();
  }

  async process(job: Job<AssignmentJobData>): Promise<void> {
    const { deliveryId } = job.data;

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) {
      this.logger.warn(`Delivery ${deliveryId} no longer exists; dropping assignment job`);
      return;
    }

    if (!ASSIGNABLE_STATUSES.has(delivery.status)) {
      this.logger.log(
        `Delivery ${deliveryId} is ${delivery.status}, not assignable; skipping ` +
          `(attempt ${job.attemptsMade + 1})`,
      );
      return;
    }

    if (delivery.status === 'CONFIRMED') {
      await this.markSearching(deliveryId);
    }

    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { assignmentAttempts: { increment: 1 } },
    });

    const matches = await this.drivers.findNearby({
      lat: delivery.pickupLat,
      lng: delivery.pickupLng,
      radiusKm: ASSIGNMENT_SEARCH_RADIUS_KM,
      limit: ASSIGNMENT_CANDIDATE_LIMIT,
    });

    const candidate = matches[0];
    if (!candidate) {
      // Throwing hands control back to BullMQ, which retries this job with
      // exponential backoff (see QueueModule's defaultJobOptions). Once
      // attempts are exhausted, `onFailed` marks the delivery FAILED.
      throw new Error(`No available drivers within ${ASSIGNMENT_SEARCH_RADIUS_KM}km of pickup`);
    }

    await this.assignDriver(deliveryId, candidate.driverId);
    this.logger.log(`Assigned driver ${candidate.driverId} to delivery ${deliveryId}`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<AssignmentJobData> | undefined, error: Error): Promise<void> {
    if (!job) return;

    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts ?? 1;
    this.logger.error(
      `Assignment attempt ${attemptsMade}/${maxAttempts} failed for delivery ` +
        `${job.data.deliveryId}: ${error.message}`,
    );

    if (attemptsMade >= maxAttempts) {
      await this.exhaustAssignment(job.data.deliveryId, error.message);
    }
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
          changedBy: SYSTEM_ACTOR,
          reason: 'Assignment queue started searching for a driver',
        },
      });
    });
  }

  private async assignDriver(deliveryId: string, driverId: string): Promise<void> {
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
          changedBy: SYSTEM_ACTOR,
          reason: `Auto-assigned to driver ${driverId}`,
        },
      });
    });
  }

  private async exhaustAssignment(deliveryId: string, reason: string): Promise<void> {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    // Only fail it if it's still sitting unassigned — a later, unrelated
    // change (customer cancelled, an earlier retry already succeeded)
    // must not be clobbered by a stale failure handler.
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
          changedBy: SYSTEM_ACTOR,
          reason: `Driver assignment exhausted all retries: ${reason}`,
        },
      });
    });
  }
}
