import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from './deliveries.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('livraisons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}
  @Get('trash') @RequirePermission('deliveries', 'view') trash() { return this.deliveries.trash(); }
  @Get() @RequirePermission('deliveries', 'view') list(@Query('search') search?: string) { return this.deliveries.list(search); }
  @Delete(':id/permanent') @RequirePermission('deliveries', 'delete_permanent') permanentlyRemove(@Param('id') id: string) { return this.deliveries.removePermanently(id); }
  @Post() @RequirePermission('deliveries', 'create') create(@Body() dto: CreateDeliveryDto) { return this.deliveries.create(dto); }
  @Patch(':id') @RequirePermission('deliveries', 'update') update(@Param('id') id: string, @Body() dto: UpdateDeliveryDto) { return this.deliveries.update(id, dto); }
  @Patch(':id/status') @RequirePermission('deliveries', 'update') status(@Param('id') id: string, @Body('status') status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED') { return this.deliveries.updateStatus(id, status); }
  @Delete(':id') @RequirePermission('deliveries', 'delete') remove(@Param('id') id: string) { return this.deliveries.remove(id); }
  @Post(':id/restore') @RequirePermission('deliveries', 'update') restore(@Param('id') id: string) { return this.deliveries.restore(id); }
}
