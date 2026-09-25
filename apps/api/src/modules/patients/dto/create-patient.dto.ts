import { IsDateString, IsEmail, IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
  @IsString() @MaxLength(100) firstName!: string;
  @IsString() @MaxLength(100) lastName!: string;
  @IsOptional() @IsString() preferredName?: string;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsObject() address?: Record<string, unknown>;
  @IsOptional() @IsObject() emergencyContact?: Record<string, unknown>;
  @IsOptional() @IsObject() medicalHistory?: Record<string, unknown>;
  @IsOptional() @IsObject() allergies?: Record<string, unknown>;
  @IsOptional() @IsString() notes?: string;
}
