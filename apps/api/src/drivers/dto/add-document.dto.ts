import { IsIn, IsString, IsUrl, MaxLength } from 'class-validator';

export class AddDocumentDto {
  @IsIn(['LICENSE', 'ID', 'INSURANCE', 'VEHICLE_REGISTRATION'])
  type!: 'LICENSE' | 'ID' | 'INSURANCE' | 'VEHICLE_REGISTRATION';

  @IsUrl()
  @MaxLength(500)
  fileUrl!: string;
}