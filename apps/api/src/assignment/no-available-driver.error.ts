/**
 * Thrown when no ONLINE driver within range has a vehicle that can carry
 * the delivery. Thrown (not returned) so a queue consumer can let it
 * propagate and trigger a retry, while a direct caller can catch it and
 * decide what "no driver available" should mean for their flow.
 */
export class NoAvailableDriverError extends Error {
  constructor(
    public readonly deliveryId: string,
    public readonly radiusKm: number,
  ) {
    super(`No available driver with capacity for delivery ${deliveryId} within ${radiusKm}km`);
    this.name = 'NoAvailableDriverError';
  }
}
