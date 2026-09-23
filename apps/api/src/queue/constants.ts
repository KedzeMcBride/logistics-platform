/** BullMQ queue name for driver-assignment jobs. */
export const ASSIGNMENT_QUEUE_NAME = 'driver-assignment';

/** BullMQ job name used when adding a job to the assignment queue. */
export const ASSIGNMENT_JOB_NAME = 'assign-driver';

/**
 * Maximum number of times the worker will attempt to find and assign a
 * driver for a single delivery before giving up. Each attempt is a fresh
 * BullMQ job attempt (see the queue's `defaultJobOptions` in
 * `QueueModule`), spaced out by exponential backoff so a temporarily empty
 * driver pool has time to fill up before the next try.
 */
export const MAX_ASSIGNMENT_ATTEMPTS = 5;

/** Base delay (ms) for the exponential backoff between assignment attempts. */
export const ASSIGNMENT_BACKOFF_DELAY_MS = 3000;

/** Radius (km) searched for an available driver around the pickup point. */
export const ASSIGNMENT_SEARCH_RADIUS_KM = 5;

/** Max number of nearby candidates fetched per assignment attempt. */
export const ASSIGNMENT_CANDIDATE_LIMIT = 5;

/** Queue that holds delayed "did the driver respond in time?" checks. */
export const ASSIGNMENT_TIMEOUT_QUEUE_NAME = 'driver-assignment-timeout';

/** Job name for a single response-deadline check. */
export const ASSIGNMENT_TIMEOUT_JOB_NAME = 'check-assignment-response';

/**
 * How long a driver has to accept/reject an offered delivery before it's
 * treated as a timeout. Kept as a named constant (not inline) so tests and
 * the processor agree on one source of truth, matching the existing
 * ASSIGNMENT_QUEUE defaultJobOptions convention from Day 14.
 */
export const ASSIGNMENT_RESPONSE_TIMEOUT_MS = 60_000; // 60s

/** Deterministic jobId builder — mirrors the Day 14 `${JOB_NAME}-${deliveryId}`
 * pattern (dash, not colon — BullMQ rejects ':' in custom job IDs, this was
 * the real bug caught in the Day 14 smoke test). Includes attempt number so
 * a re-scheduled timeout after a reject doesn't collide with a stale job ID
 * still resolving in Redis. */
export function buildAssignmentTimeoutJobId(deliveryId: string, attempt: number): string {
  return `${ASSIGNMENT_TIMEOUT_JOB_NAME}-${deliveryId}-${attempt}`;
}
