import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AssignmentModule } from '../assignment';
import { DriversModule } from '../drivers';

import { AssignmentTimeoutProcessor } from './assignment-timeout.processor';
import { AssignmentQueueService } from './assignment-queue.service';
import { AssignmentProcessor } from './assignment.processor';

import {
  ASSIGNMENT_BACKOFF_DELAY_MS,
  ASSIGNMENT_QUEUE_NAME,
  MAX_ASSIGNMENT_ATTEMPTS,
  ASSIGNMENT_TIMEOUT_QUEUE_NAME,
} from './constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
          maxRetriesPerRequest: null,
        },
      }),
    }),

    BullModule.registerQueue({
      name: ASSIGNMENT_QUEUE_NAME,
      defaultJobOptions: {
        attempts: MAX_ASSIGNMENT_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: ASSIGNMENT_BACKOFF_DELAY_MS,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
      },
    }),

    BullModule.registerQueue({
      name: ASSIGNMENT_TIMEOUT_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 1,
        backoff: {
          type: 'exponential',
          delay: ASSIGNMENT_BACKOFF_DELAY_MS,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
      },
    }),

    DriversModule,
    AssignmentModule,
  ],

  providers: [AssignmentQueueService, AssignmentProcessor, AssignmentTimeoutProcessor],

  exports: [AssignmentQueueService],
})
export class QueueModule {}
