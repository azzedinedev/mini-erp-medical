import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, StockMovementDto, UpdateInventoryItemDto } from './inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('inventaire')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get('trash') @RequirePermission('inventory', 'view') trash() { return this.inventory.trash(); }
  @Get() @RequirePermission('inventory', 'view') list(@Query('search') search?: string) { return this.inventory.list(search); }
  @Delete(':id/permanent') @RequirePermission('inventory', 'delete_permanent') permanentlyRemove(@Param('id') id: string) { return this.inventory.removePermanently(id); }
  @Post() @RequirePermission('inventory', 'create') create(@Body() dto: CreateInventoryItemDto) { return this.inventory.create(dto); }
  @Patch(':id') @RequirePermission('inventory', 'update') update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) { return this.inventory.update(id, dto); }
  @Delete(':id') @RequirePermission('inventory', 'delete') remove(@Param('id') id: string) { return this.inventory.remove(id); }
  @Post(':id/restore') @RequirePermission('inventory', 'update') restore(@Param('id') id: string) { return this.inventory.restore(id); }
  @Post(':id/movements') @RequirePermission('inventory', 'update') move(@Param('id') id: string, @Body() dto: StockMovementDto) { return this.inventory.move(id, dto); }
}
