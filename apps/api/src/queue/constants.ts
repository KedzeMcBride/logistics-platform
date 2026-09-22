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
