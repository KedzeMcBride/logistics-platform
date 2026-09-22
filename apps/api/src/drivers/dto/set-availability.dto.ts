import { DriverAvailability } from '@repo/shared';
import { IsEnum, IsLatitude, IsLongitude, ValidateIf } from 'class-validator';

export class SetAvailabilityDto {
  @IsEnum(DriverAvailability)
  availability!: DriverAvailability;

  // Optional current position, sent by the client (e.g. when the driver
  // goes ONLINE from the browser). Both fields must be provided together.
  @ValidateIf((dto: SetAvailabilityDto) => dto.lat !== undefined || dto.lng !== undefined)
  @IsLatitude()
  lat?: number;

  @ValidateIf((dto: SetAvailabilityDto) => dto.lat !== undefined || dto.lng !== undefined)
  @IsLongitude()
  lng?: number;
}
