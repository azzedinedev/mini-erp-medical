import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MedicalStaffService } from './medical-staff.service';
import { CreateMedicalStaffDto, UpdateMedicalStaffDto } from './medical-staff.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('personnel médical')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('medical-staff')
export class MedicalStaffController {
  constructor(private readonly staff: MedicalStaffService) {}
  @Get('trash') @RequirePermission('medical-staff', 'view') trash() { return this.staff.trash(); }
  @Get() @RequirePermission('medical-staff', 'view') list() { return this.staff.list(); }
  @Delete(':id/permanent') @RequirePermission('medical-staff', 'delete_permanent') permanentlyRemove(@Param('id') id: string) { return this.staff.removePermanently(id); }
  @Post() @RequirePermission('medical-staff', 'create') create(@Body() dto: CreateMedicalStaffDto) { return this.staff.create(dto); }
  @Patch(':id') @RequirePermission('medical-staff', 'update') update(@Param('id') id: string, @Body() dto: UpdateMedicalStaffDto) { return this.staff.update(id, dto); }
  @Post(':id/restore') @RequirePermission('medical-staff', 'update') restore(@Param('id') id: string) { return this.staff.restore(id); }
  @Delete(':id') @RequirePermission('medical-staff', 'archive') archive(@Param('id') id: string) { return this.staff.archive(id); }
}
