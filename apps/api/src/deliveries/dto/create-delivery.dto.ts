import { DeliveryPriority } from '@repo/shared';
import {
  IsEnum,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDeliveryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  pickupAddress!: string;

  @IsLatitude()
  pickupLat!: number;

  @IsLongitude()
  pickupLng!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  destinationAddress!: string;

  @IsLatitude()
  destinationLat!: number;

  @IsLongitude()
  destinationLng!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  packageDescription!: string;

  @IsIn(['SMALL', 'MEDIUM', 'LARGE'])
  packageSizeCategory!: 'SMALL' | 'MEDIUM' | 'LARGE';

  @IsNumber()
  @Min(0.1)
  @Max(500)
  packageWeightKg!: number;

  @IsEnum(DeliveryPriority)
  priority!: DeliveryPriority;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipientName!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(30)
  recipientPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
