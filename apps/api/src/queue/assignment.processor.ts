import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { AssignmentService } from '../assignment/assignment.service';

import type { AssignmentJobData } from './assignment-queue.service';
import { ASSIGNMENT_QUEUE_NAME } from './constants';

@Processor(ASSIGNMENT_QUEUE_NAME)
export class AssignmentProcessor extends WorkerHost {
  private readonly logger = new Logger(AssignmentProcessor.name);

  constructor(private readonly assignmentService: AssignmentService) {
    super();
  }

  async process(job: Job<AssignmentJobData>): Promise<void> {
    const { deliveryId } = job.data;

    const result = await this.assignmentService.assignDriver(deliveryId);

    if (result.outcome === 'skipped') {
      this.logger.log(
        `Assignment skipped for delivery ${deliveryId}: ${result.reason}`,
      );
      return;
    }

    this.logger.log(
      `Assigned driver ${result.driverId} to delivery ${result.deliveryId}`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(
    job: Job<AssignmentJobData> | undefined,
    error: Error,
  ): Promise<void> {
    if (!job) return;

    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts ?? 1;

    this.logger.error(
      `Assignment attempt ${attemptsMade}/${maxAttempts} failed for delivery ` +
        `${job.data.deliveryId}: ${error.message}`,
    );

    if (attemptsMade >= maxAttempts) {
      await this.assignmentService.markFailed(
        job.data.deliveryId,
        error.message,
      );
    }
  }
}