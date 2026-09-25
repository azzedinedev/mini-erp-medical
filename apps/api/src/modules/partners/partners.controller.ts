import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('partenaires')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}
  @Get() @RequirePermission('partners', 'view') list(@Query('search') search?: string) { return this.partners.list(search); }
  @Delete(':id') @RequirePermission('partners', 'delete') archive(@Param('id') id: string) { return this.partners.archive(id); }
}
