import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { FinancialStatus } from '@prisma/client';
import { FinanceService, FinancialLineInput } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

class FinanceDto { @IsString() kind!: string; @IsString() currency!: string; @IsOptional() @IsString() partnerId?: string; @IsOptional() @IsString() notes?: string; @IsOptional() @IsEnum(FinancialStatus) status?: FinancialStatus; @IsArray() lines!: FinancialLineInput[]; }
class UpdateFinanceDto extends PartialType(FinanceDto) {}
@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}
  @Get('trash') @RequirePermission('finance', 'view') trash() { return this.finance.trash(); }
  @Get() @RequirePermission('finance', 'view') list() { return this.finance.list(); }
  @Delete(':id/permanent') @RequirePermission('finance', 'delete_permanent') permanentlyRemove(@Param('id') id: string) { return this.finance.removePermanently(id); }
  @Post() @RequirePermission('finance', 'create') create(@Body() dto: FinanceDto) { return this.finance.create(dto); }
  @Patch(':id') @RequirePermission('finance', 'update') update(@Param('id') id: string, @Body() dto: UpdateFinanceDto) { return this.finance.update(id, dto); }
  @Delete(':id') @RequirePermission('finance', 'delete') remove(@Param('id') id: string) { return this.finance.remove(id); }
  @Post(':id/restore') @RequirePermission('finance', 'update') restore(@Param('id') id: string) { return this.finance.restore(id); }
}
