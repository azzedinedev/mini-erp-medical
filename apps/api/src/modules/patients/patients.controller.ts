import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PaginationPipe, PaginationQuery } from '../../common/pipes/pagination.pipe';
import { JwtAuthGuard, AuthPrincipal } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

type RequestWithUser = { user: AuthPrincipal };
@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @RequirePermission('patients', 'view')
  list(@Query(new PaginationPipe()) query: PaginationQuery) { return this.patients.list(query); }

  @Get(':id')
  @RequirePermission('patients', 'view')
  findOne(@Param('id') id: string) { return this.patients.findOne(id); }

  @Post()
  @RequirePermission('patients', 'create')
  create(@Body() dto: CreatePatientDto, @Req() req: RequestWithUser) { return this.patients.create(dto, req.user.sub); }

  @Patch(':id')
  @RequirePermission('patients', 'update')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @Req() req: RequestWithUser) { return this.patients.update(id, dto, req.user.sub); }

  @Post(':id/archive')
  @RequirePermission('patients', 'archive')
  archive(@Param('id') id: string) { return this.patients.archive(id); }

  @Delete(':id')
  @RequirePermission('patients', 'delete')
  remove(@Param('id') id: string) { return this.patients.remove(id); }
}
