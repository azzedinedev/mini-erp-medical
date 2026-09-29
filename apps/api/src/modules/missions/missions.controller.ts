import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MissionsService } from './missions.service';
import { CreateMissionDto, UpdateMissionDto } from './missions.dto';
import { JwtAuthGuard, AuthPrincipal } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

type RequestWithUser = { user: AuthPrincipal };
@ApiTags('missions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly missions: MissionsService) {}
  @Get('trash') @RequirePermission('missions', 'view') trash() { return this.missions.trash(); }
  @Get() @RequirePermission('missions', 'view') list(@Query('search') search?: string) { return this.missions.list(search); }
  @Delete(':id/permanent') @RequirePermission('missions', 'delete_permanent') permanentlyRemove(@Param('id') id: string) { return this.missions.removePermanently(id); }
  @Post() @RequirePermission('missions', 'create') create(@Body() dto: CreateMissionDto, @Req() req: RequestWithUser) { return this.missions.create(dto, req.user.sub); }
  @Patch(':id') @RequirePermission('missions', 'update') update(@Param('id') id: string, @Body() dto: UpdateMissionDto) { return this.missions.update(id, dto); }
  @Patch(':id/status') @RequirePermission('missions', 'update') status(@Param('id') id: string, @Body('status') status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') { return this.missions.updateStatus(id, status); }
  @Delete(':id') @RequirePermission('missions', 'delete') remove(@Param('id') id: string) { return this.missions.remove(id); }
  @Post(':id/restore') @RequirePermission('missions', 'update') restore(@Param('id') id: string) { return this.missions.restore(id); }
}
