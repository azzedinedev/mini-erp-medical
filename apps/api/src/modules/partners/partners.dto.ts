import { IsEmail, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreatePartnerDto {
  @IsString() @MaxLength(180) name!: string;
  @IsString() @MaxLength(80) kind!: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsObject() address?: Record<string, unknown>;
  @IsOptional() @IsString() notes?: string;
}

export class UpdatePartnerDto extends PartialType(CreatePartnerDto) {}
