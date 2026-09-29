import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { FinanceService, FinancialLineInput } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

class FinanceDto { @IsString() kind!: string; @IsString() currency!: string; @IsOptional() @IsString() partnerId?: string; @IsArray() lines!: FinancialLineInput[]; }
@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}
  @Get() @RequirePermission('finance', 'view') list() { return this.finance.list(); }
  @Post() @RequirePermission('finance', 'create') create(@Body() dto: FinanceDto) { return this.finance.create(dto); }
}
