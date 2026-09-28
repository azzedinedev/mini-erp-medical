import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ReferenceKind } from '@prisma/client';
import { ReferenceDataService } from './reference-data.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

class MedicationDto { @IsString() name!: string; @IsOptional() @IsString() molecule?: string; @IsOptional() @IsString() form?: string; @IsOptional() @IsString() dosage?: string; @IsOptional() @IsString() unit?: string; }
class TypeDto { @IsEnum(ReferenceKind) kind!: ReferenceKind; @IsString() code!: string; @IsObject() labels!: Record<string, string>; @IsOptional() @IsString() icon?: string; @IsOptional() @IsString() color?: string; }
@ApiTags('référentiels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reference-data')
export class ReferenceDataController {
  constructor(private readonly reference: ReferenceDataService) {}
  @Get('types') @RequirePermission('references', 'view') types(@Query('kind') kind?: ReferenceKind) { return this.reference.listTypes(kind); }
  @Get('medications') @RequirePermission('references', 'view') medications(@Query('search') search?: string) { return this.reference.listMedications(search); }
  @Post('medications') @RequirePermission('references', 'create') medication(@Body() dto: MedicationDto) { return this.reference.createMedication(dto); }
  @Post('types') @RequirePermission('references', 'create') type(@Body() dto: TypeDto) { return this.reference.createType(dto); }
}
