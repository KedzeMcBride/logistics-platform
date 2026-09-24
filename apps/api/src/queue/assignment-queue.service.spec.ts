import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';

import { AssignmentQueueService } from './assignment-queue.service';
import {
  ASSIGNMENT_JOB_NAME,
  ASSIGNMENT_QUEUE_NAME,
  ASSIGNMENT_TIMEOUT_QUEUE_NAME,
} from './constants';

describe('AssignmentQueueService', () => {
  let service: AssignmentQueueService;
  let mockQueue: {
    add: jest.Mock;
    client: Promise<{ status: string }> | Promise<never>;
  };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      client: Promise.resolve({ status: 'ready' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentQueueService,
        { provide: getQueueToken(ASSIGNMENT_QUEUE_NAME), useValue: mockQueue },
        { provide: getQueueToken(ASSIGNMENT_TIMEOUT_QUEUE_NAME), useValue: mockQueue },
      ],
    }).compile();

    service = module.get(AssignmentQueueService);
  });

  describe('enqueueAssignment', () => {
    it('adds a job with the delivery id and a deterministic, idempotent jobId', async () => {
      await service.enqueueAssignment('delivery-1');

      expect(mockQueue.add).toHaveBeenCalledWith(
        ASSIGNMENT_JOB_NAME,
        { deliveryId: 'delivery-1' },
        { jobId: `${ASSIGNMENT_JOB_NAME}-delivery-1` },
      );
    });

    it('uses the same jobId for repeated calls with the same delivery (idempotency)', async () => {
      await service.enqueueAssignment('delivery-1');
      await service.enqueueAssignment('delivery-1');

      const jobIds = mockQueue.add.mock.calls.map((call) => call[2]?.jobId);
      expect(new Set(jobIds).size).toBe(1);
    });

    it('propagates an error when the queue is unreachable (e.g. Redis is down)', async () => {
      mockQueue.add.mockRejectedValue(new Error('connect ECONNREFUSED'));

      await expect(service.enqueueAssignment('delivery-1')).rejects.toThrow('connect ECONNREFUSED');
    });
  });

  describe('isHealthy', () => {
    it('returns true when the underlying Redis connection status is "ready"', async () => {
      await expect(service.isHealthy()).resolves.toBe(true);
    });

    it('returns false when the connection is not ready (e.g. reconnecting)', async () => {
      mockQueue.client = Promise.resolve({ status: 'connecting' });

      await expect(service.isHealthy()).resolves.toBe(false);
    });

    it('returns false when the queue has no client connection available', async () => {
      mockQueue.client = Promise.reject(new Error('not connected'));

      await expect(service.isHealthy()).resolves.toBe(false);
    });
  });
});
