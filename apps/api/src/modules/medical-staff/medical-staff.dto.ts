import { IsEmail, IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { StaffType } from '@prisma/client';
import { PartialType } from '@nestjs/swagger';

export class CreateMedicalStaffDto {
  @IsEnum(StaffType) staffType!: StaffType;
  @IsString() @MaxLength(100) firstName!: string;
  @IsString() @MaxLength(100) lastName!: string;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsObject() availability?: Record<string, unknown>;
}

export class UpdateMedicalStaffDto extends PartialType(CreateMedicalStaffDto) {}
