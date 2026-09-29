import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MedicalStaffService } from './medical-staff.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('personnel médical')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('medical-staff')
export class MedicalStaffController {
  constructor(private readonly staff: MedicalStaffService) {}
  @Get() @RequirePermission('medical-staff', 'view') list() { return this.staff.list(); }
  @Delete(':id') @RequirePermission('medical-staff', 'delete') archive(@Param('id') id: string) { return this.staff.archive(id); }
}
