import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('livraisons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}
  @Get() @RequirePermission('deliveries', 'view') list(@Query('search') search?: string) { return this.deliveries.list(search); }
  @Patch(':id/status') @RequirePermission('deliveries', 'update') status(@Param('id') id: string, @Body('status') status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED') { return this.deliveries.updateStatus(id, status); }
}
