import { DriverAvailability } from '@repo/shared';
import { IsEnum } from 'class-validator';

export class SetAvailabilityDto {
  @IsEnum(DriverAvailability)
  availability!: DriverAvailability;
}