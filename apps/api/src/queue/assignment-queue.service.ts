import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { ASSIGNMENT_JOB_NAME, ASSIGNMENT_QUEUE_NAME } from './constants';

export interface AssignmentJobData {
  deliveryId: string;
}

@Injectable()
export class AssignmentQueueService {
  constructor(
    @InjectQueue(ASSIGNMENT_QUEUE_NAME)
    private readonly queue: Queue<AssignmentJobData>,
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

  async isHealthy(): Promise<boolean> {
    try {
      const client = await this.queue.client;
      return client?.status === 'ready';
    } catch {
      return false;
    }
  }
}
