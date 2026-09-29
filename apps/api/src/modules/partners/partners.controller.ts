import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerDto, UpdatePartnerDto } from './partners.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('partenaires')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}
  @Get('trash') @RequirePermission('partners', 'view') trash() { return this.partners.trash(); }
  @Get() @RequirePermission('partners', 'view') list(@Query('search') search?: string) { return this.partners.list(search); }
  @Delete(':id/permanent') @RequirePermission('partners', 'delete_permanent') permanentlyRemove(@Param('id') id: string) { return this.partners.removePermanently(id); }
  @Post() @RequirePermission('partners', 'create') create(@Body() dto: CreatePartnerDto) { return this.partners.create(dto); }
  @Patch(':id') @RequirePermission('partners', 'update') update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) { return this.partners.update(id, dto); }
  @Post(':id/restore') @RequirePermission('partners', 'update') restore(@Param('id') id: string) { return this.partners.restore(id); }
  @Delete(':id') @RequirePermission('partners', 'archive') archive(@Param('id') id: string) { return this.partners.archive(id); }
}
