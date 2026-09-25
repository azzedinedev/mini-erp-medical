import { IsArray, IsBase64, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PrescriptionItemDto {
  @IsOptional() @IsString() medicationId?: string;
  @IsOptional() @IsString() manualName?: string;
  @IsOptional() @IsString() dosage?: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsString() instructions?: string;
}

export class CreatePrescriptionDto {
  @IsString() patientId!: string;
  @IsString() prescriberId!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PrescriptionItemDto) items!: PrescriptionItemDto[];
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsDateString() validUntil?: string;
}

export class SignPrescriptionDto {
  @IsString() @IsBase64() signatureData!: string;
}
