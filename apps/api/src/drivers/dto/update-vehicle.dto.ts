import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plateNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5000)
  capacityKg?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}