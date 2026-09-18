export const DeliveryPriority = {
  STANDARD: 'STANDARD',
  EXPRESS: 'EXPRESS',
  SAME_DAY: 'SAME_DAY',
} as const;

export type DeliveryPriority = (typeof DeliveryPriority)[keyof typeof DeliveryPriority];

export const ALL_DELIVERY_PRIORITIES: readonly DeliveryPriority[] = Object.values(DeliveryPriority);