import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  ASSIGNMENT_QUEUE_NAME,
  ASSIGNMENT_JOB_NAME, // existing
  ASSIGNMENT_TIMEOUT_QUEUE_NAME, // new
  ASSIGNMENT_TIMEOUT_JOB_NAME,
  ASSIGNMENT_RESPONSE_TIMEOUT_MS,
  buildAssignmentTimeoutJobId,
} from './constants';

export interface AssignmentJobData {
  deliveryId: string;
}

@Injectable()
export class AssignmentQueueService {
  private readonly logger = new Logger(AssignmentQueueService.name); // if not already present

  constructor(
    @InjectQueue(ASSIGNMENT_QUEUE_NAME) private readonly queue: Queue,
    @InjectQueue(ASSIGNMENT_TIMEOUT_QUEUE_NAME) private readonly timeoutQueue: Queue, // NEW
  ) {}

  async enqueueAssignment(deliveryId: string): Promise<void> {
    await this.queue.add(
      ASSIGNMENT_JOB_NAME,
      { deliveryId },
      {
        jobId: `${ASSIGNMENT_JOB_NAME}-${deliveryId}`,
      },
    );
  }

  async scheduleResponseTimeout(
    deliveryId: string,
    driverId: string,
    attempt: number,
    delayMs: number = ASSIGNMENT_RESPONSE_TIMEOUT_MS,
  ): Promise<void> {
    const jobId = buildAssignmentTimeoutJobId(deliveryId, attempt);
    try {
      await this.timeoutQueue.add(
        ASSIGNMENT_TIMEOUT_JOB_NAME,
        { deliveryId, driverId, attempt },
        { jobId, delay: delayMs, removeOnComplete: true, removeOnFail: true },
      );
    } catch (err) {
      this.logger.error(`Failed to schedule assignment timeout for delivery ${deliveryId}: ${err}`);
    }
  }

  async cancelResponseTimeout(deliveryId: string, attempt: number): Promise<void> {
    const jobId = buildAssignmentTimeoutJobId(deliveryId, attempt);
    try {
      const job = await this.timeoutQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      this.logger.warn(
        `Failed to cancel assignment timeout job ${jobId} for delivery ${deliveryId}: ${err}`,
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const client = await this.queue.client;
      return client?.status === 'ready';
    } catch {
      return false;
    }
  }
}
