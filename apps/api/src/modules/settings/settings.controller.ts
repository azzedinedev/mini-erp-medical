import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { Prisma } from '@prisma/client';
import { SettingsService } from './settings.service';
import { JwtAuthGuard, AuthPrincipal } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

class SettingDto { @IsObject() value!: Record<string, unknown>; }
@ApiTags('paramétrage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}
  @Get() @RequirePermission('settings', 'view') all() { return this.settings.all(); }
  @Put(':key') @RequirePermission('settings', 'update') set(@Param('key') key: string, @Body() dto: SettingDto) { return this.settings.set(key, dto.value as Prisma.InputJsonValue); }
}
