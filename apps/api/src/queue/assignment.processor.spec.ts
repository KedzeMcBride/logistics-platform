import type { Job } from 'bullmq';

import type { AssignmentService } from '../assignment/assignment.service';

import { AssignmentProcessor } from './assignment.processor';

describe('AssignmentProcessor', () => {
  let processor: AssignmentProcessor;
  let assignmentService: {
    assignDriver: jest.Mock;
    markFailed: jest.Mock;
  };

  beforeEach(() => {
    assignmentService = {
      assignDriver: jest.fn(),
      markFailed: jest.fn(),
    };

    processor = new AssignmentProcessor(assignmentService as unknown as AssignmentService);
  });

  function makeJob(
    overrides: Partial<Job<{ deliveryId: string }>> = {},
  ): Job<{ deliveryId: string }> {
    return {
      data: { deliveryId: 'delivery-1' },
      attemptsMade: 1,
      opts: { attempts: 5 },
      ...overrides,
    } as Job<{ deliveryId: string }>;
  }

  describe('process', () => {
    it('delegates assignment to AssignmentService and logs the assigned driver', async () => {
      assignmentService.assignDriver.mockResolvedValue({
        outcome: 'assigned',
        deliveryId: 'delivery-1',
        driverId: 'driver-1',
      });

      await processor.process(makeJob());

      expect(assignmentService.assignDriver).toHaveBeenCalledWith('delivery-1');
      expect(assignmentService.assignDriver).toHaveBeenCalledTimes(1);
    });

    it('does not throw when AssignmentService skips the assignment', async () => {
      assignmentService.assignDriver.mockResolvedValue({
        outcome: 'skipped',
        deliveryId: 'delivery-1',
        reason: 'Delivery is CANCELLED, not assignable',
      });

      await expect(processor.process(makeJob())).resolves.toBeUndefined();

      expect(assignmentService.assignDriver).toHaveBeenCalledWith('delivery-1');
    });

    it('propagates assignment errors so BullMQ can retry the job', async () => {
      assignmentService.assignDriver.mockRejectedValue(
        new Error('No available drivers within 5km of pickup'),
      );

      await expect(processor.process(makeJob())).rejects.toThrow(/No available drivers/);

      expect(assignmentService.assignDriver).toHaveBeenCalledWith('delivery-1');
    });
  });

  describe('onFailed', () => {
    it('does not mark the delivery FAILED while retries remain', async () => {
      await processor.onFailed(
        makeJob({
          attemptsMade: 2,
          opts: { attempts: 5 },
        }),
        new Error('no drivers'),
      );

      expect(assignmentService.markFailed).not.toHaveBeenCalled();
    });

    it('marks the delivery FAILED once the final attempt is exhausted', async () => {
      await processor.onFailed(
        makeJob({
          attemptsMade: 5,
          opts: { attempts: 5 },
        }),
        new Error('no drivers'),
      );

      expect(assignmentService.markFailed).toHaveBeenCalledWith('delivery-1', 'no drivers');

      expect(assignmentService.markFailed).toHaveBeenCalledTimes(1);
    });

    it('uses the configured attempt count when deciding whether to fail', async () => {
      await processor.onFailed(
        makeJob({
          attemptsMade: 3,
          opts: { attempts: 3 },
        }),
        new Error('assignment failed'),
      );

      expect(assignmentService.markFailed).toHaveBeenCalledWith('delivery-1', 'assignment failed');
    });

    it('does not clobber the delivery while retries remain', async () => {
      await processor.onFailed(
        makeJob({
          attemptsMade: 4,
          opts: { attempts: 5 },
        }),
        new Error('temporary failure'),
      );

      expect(assignmentService.markFailed).not.toHaveBeenCalled();
    });

    it('ignores a failed event with no job', async () => {
      await expect(processor.onFailed(undefined, new Error('x'))).resolves.toBeUndefined();

      expect(assignmentService.markFailed).not.toHaveBeenCalled();
    });
  });
});
