import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service'; // ADJUST path to match repo convention
import { AssignmentService } from '../assignment/assignment.service';
import { ASSIGNMENT_TIMEOUT_QUEUE_NAME } from './constants';

interface AssignmentTimeoutJobData {
  deliveryId: string;
  driverId: string;
  attempt: number;
}

/**
 * Worker for the driver-assignment-timeout queue. A job here fires
 * ASSIGNMENT_RESPONSE_TIMEOUT_MS after a delivery moves to DRIVER_ASSIGNED.
 * If the driver hasn't responded by the time this runs, the assignment is
 * treated as a timeout: the driver is excluded from re-matching and the
 * delivery goes back through the existing SEARCHING_FOR_DRIVER /
 * assignment-attempt machinery from Day 14.
 *
 * Mirrors AssignmentProcessor's re-fetch-and-recheck-status guard: a
 * delivery may have already been responded to (accept/reject cancels this
 * job, but cancellation is best-effort per the "log, don't throw" Redis
 * convention) or cancelled by the customer while this job was in-flight.
 */
@Processor(ASSIGNMENT_TIMEOUT_QUEUE_NAME)
export class AssignmentTimeoutProcessor extends WorkerHost {
  private readonly logger = new Logger(AssignmentTimeoutProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assignmentService: AssignmentService,
  ) {
    super();
  }

  async process(job: Job<AssignmentTimeoutJobData>): Promise<void> {
    const { deliveryId, driverId, attempt } = job.data;

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    // Delivery deleted, or moved on for an unrelated reason (customer
    // cancelled, admin intervened) — no-op, same guard shape as
    // AssignmentProcessor's cancelled/deleted-delivery handling.
    if (!delivery) {
      this.logger.warn(`Assignment timeout job for missing delivery ${deliveryId} — skipping`);
      return;
    }

    // Driver already responded (accept or reject) — the cancelResponseTimeout
    // call should have removed this job, but treat a race as a no-op rather
    // than trusting cancellation alone.
    if (delivery.driverRespondedAt) {
      return;
    }

    // Status moved on for a reason unrelated to this specific offer (e.g.
    // customer cancellation, or a later attempt already superseded this one).
    if (delivery.status !== 'DRIVER_ASSIGNED' || delivery.driverId !== driverId) {
      return;
    }

    // Deadline hasn't actually passed yet — defensive check in case a
    // re-scheduled job with a shorter delay ran ahead of an older one.
    if (delivery.driverResponseDeadline && delivery.driverResponseDeadline > new Date()) {
      return;
    }

    this.logger.log(
      `Driver ${driverId} timed out responding to delivery ${deliveryId} (attempt ${attempt})`,
    );

    await this.assignmentService.handleTimeout(deliveryId, driverId, attempt);
  }
}
