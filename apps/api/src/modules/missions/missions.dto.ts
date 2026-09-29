import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
export class CreateMissionDto { @IsString() title!: string; @IsOptional() @IsString() patientId?: string; @IsOptional() @IsString() partnerId?: string; @IsOptional() @IsString() assignedToId?: string; @IsDateString() scheduledAt!: string; @IsOptional() @IsNumber() estimatedCost?: number; @IsOptional() @IsString() notes?: string; }
export class UpdateMissionDto extends PartialType(CreateMissionDto) {}
