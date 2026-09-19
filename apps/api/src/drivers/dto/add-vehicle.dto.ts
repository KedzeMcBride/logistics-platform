import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class AddVehicleDto {
  @IsIn(['BIKE', 'CAR', 'VAN', 'TRUCK'])
  type!: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plateNumber!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5000)
  capacityKg?: number;
}