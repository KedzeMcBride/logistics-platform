import { DeliveryPriority } from '@repo/shared';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, Max, Min } from 'class-validator';

export class QuoteDeliveryDto {
  @IsLatitude()
  pickupLat!: number;

  @IsLongitude()
  pickupLng!: number;

  @IsLatitude()
  destinationLat!: number;

  @IsLongitude()
  destinationLng!: number;

  @IsNumber()
  @Min(0.1)
  @Max(500)
  packageWeightKg!: number;

  @IsEnum(DeliveryPriority)
  priority!: DeliveryPriority;
}
