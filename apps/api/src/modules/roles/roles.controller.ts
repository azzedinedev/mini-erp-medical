import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

class RoleDto { @IsString() name!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsArray() permissions?: Array<{ module: string; action: string }>; }
@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}
  @Get() @RequirePermission('users', 'view') list() { return this.roles.list(); }
  @Post() @RequirePermission('users', 'create') create(@Body() dto: RoleDto) { return this.roles.create(dto.name, dto.description, dto.permissions); }
  @Patch(':id/permissions') @RequirePermission('users', 'update') permissions(@Param('id') id: string, @Body('permissions') permissions: Array<{ module: string; action: string }>) { return this.roles.replacePermissions(id, permissions); }
}
