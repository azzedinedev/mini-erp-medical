import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { ReferenceKind } from '@prisma/client';
import { ReferenceDataService } from './reference-data.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

class MedicationDto { @IsString() name!: string; @IsOptional() @IsString() molecule?: string; @IsOptional() @IsString() form?: string; @IsOptional() @IsString() dosage?: string; @IsOptional() @IsString() unit?: string; }
class UpdateMedicationDto extends PartialType(MedicationDto) {}
class TypeDto { @IsEnum(ReferenceKind) kind!: ReferenceKind; @IsString() code!: string; @IsObject() labels!: Record<string, string>; @IsOptional() @IsString() icon?: string; @IsOptional() @IsString() color?: string; }
class UpdateTypeDto extends PartialType(TypeDto) {}
@ApiTags('référentiels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reference-data')
export class ReferenceDataController {
  constructor(private readonly reference: ReferenceDataService) {}
  @Get('types/trash') @RequirePermission('references', 'view') trashedTypes() { return this.reference.trashTypes(); }
  @Get('medications/trash') @RequirePermission('references', 'view') trashedMedications() { return this.reference.trashMedications(); }
  @Get('types') @RequirePermission('references', 'view') types(@Query('kind') kind?: ReferenceKind) { return this.reference.listTypes(kind); }
  @Get('medications') @RequirePermission('references', 'view') medications(@Query('search') search?: string) { return this.reference.listMedications(search); }
  @Post('medications') @RequirePermission('references', 'create') medication(@Body() dto: MedicationDto) { return this.reference.createMedication(dto); }
  @Patch('medications/:id') @RequirePermission('references', 'update') updateMedication(@Param('id') id: string, @Body() dto: UpdateMedicationDto) { return this.reference.updateMedication(id, dto); }
  @Delete('medications/:id/permanent') @RequirePermission('references', 'delete_permanent') permanentlyRemoveMedication(@Param('id') id: string) { return this.reference.removeMedicationPermanently(id); }
  @Delete('medications/:id') @RequirePermission('references', 'delete') removeMedication(@Param('id') id: string) { return this.reference.removeMedication(id); }
  @Post('medications/:id/restore') @RequirePermission('references', 'update') restoreMedication(@Param('id') id: string) { return this.reference.restoreMedication(id); }
  @Post('types') @RequirePermission('references', 'create') type(@Body() dto: TypeDto) { return this.reference.createType(dto); }
  @Patch('types/:id') @RequirePermission('references', 'update') updateType(@Param('id') id: string, @Body() dto: UpdateTypeDto) { return this.reference.updateType(id, dto); }
  @Delete('types/:id/permanent') @RequirePermission('references', 'delete_permanent') permanentlyRemoveType(@Param('id') id: string) { return this.reference.removeTypePermanently(id); }
  @Delete('types/:id') @RequirePermission('references', 'delete') removeType(@Param('id') id: string) { return this.reference.removeType(id); }
  @Post('types/:id/restore') @RequirePermission('references', 'update') restoreType(@Param('id') id: string) { return this.reference.restoreType(id); }
}
