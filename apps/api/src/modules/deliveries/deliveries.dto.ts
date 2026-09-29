import { IsDateString, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { DeliveryStatus } from '@prisma/client';
import { PartialType } from '@nestjs/swagger';

export class CreateDeliveryDto {
  @IsOptional() @IsString() partnerId?: string;
  @IsOptional() @IsEnum(DeliveryStatus) status?: DeliveryStatus;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsObject() address?: Record<string, unknown>;
  @IsOptional() @IsString() trackingNote?: string;
}

export class UpdateDeliveryDto extends PartialType(CreateDeliveryDto) {}
