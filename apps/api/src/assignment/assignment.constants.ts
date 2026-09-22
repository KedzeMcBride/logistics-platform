/** Statuses from which a delivery is eligible to be assigned a driver. */
export const ASSIGNABLE_STATUSES = new Set(['CONFIRMED', 'SEARCHING_FOR_DRIVER']);

/** Radius (km) searched for an available driver around the pickup point. */
export const ASSIGNMENT_SEARCH_RADIUS_KM = 5;

/** Max number of nearby candidates fetched per assignment attempt. */
export const ASSIGNMENT_CANDIDATE_LIMIT = 5;

/** Actor recorded on status-history rows written by the assignment system. */
export const ASSIGNMENT_SYSTEM_ACTOR = 'system:assignment-service';
