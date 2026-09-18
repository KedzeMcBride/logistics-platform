export const DriverAvailability = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  ON_DELIVERY: 'ON_DELIVERY',
} as const;

export type DriverAvailability = (typeof DriverAvailability)[keyof typeof DriverAvailability];

export const ALL_DRIVER_AVAILABILITIES: readonly DriverAvailability[] =
  Object.values(DriverAvailability);
