import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { DocumentEntityType } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard, AuthPrincipal } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

class DocumentMetadataDto { @IsString() title!: string; @IsString() category!: string; @IsEnum(DocumentEntityType) entityType!: DocumentEntityType; @IsString() fileName!: string; @IsString() mimeType!: string; @IsString() storageKey!: string; @IsNumber() sizeBytes!: number; @IsOptional() @IsObject() metadata?: Record<string, unknown>; }
type RequestWithUser = { user: AuthPrincipal };
@ApiTags('GED')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}
  @Get() @RequirePermission('documents', 'view') list(@Query('search') search?: string) { return this.documents.list(search); }
  @Post('metadata') @RequirePermission('documents', 'create') metadata(@Body() dto: DocumentMetadataDto, @Req() req: RequestWithUser) { return this.documents.createMetadata({ ...dto, createdById: req.user.sub }); }
}
