import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, StockMovementDto } from './inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('inventaire')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get() @RequirePermission('inventory', 'view') list(@Query('search') search?: string) { return this.inventory.list(search); }
  @Post() @RequirePermission('inventory', 'create') create(@Body() dto: CreateInventoryItemDto) { return this.inventory.create(dto); }
  @Post(':id/movements') @RequirePermission('inventory', 'update') move(@Param('id') id: string, @Body() dto: StockMovementDto) { return this.inventory.move(id, dto); }
}
