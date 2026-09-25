import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './missions.dto';
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
  @Get() @RequirePermission('missions', 'view') list(@Query('search') search?: string) { return this.missions.list(search); }
  @Post() @RequirePermission('missions', 'create') create(@Body() dto: CreateMissionDto, @Req() req: RequestWithUser) { return this.missions.create(dto, req.user.sub); }
  @Patch(':id/status') @RequirePermission('missions', 'update') status(@Param('id') id: string, @Body('status') status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') { return this.missions.updateStatus(id, status); }
}
