import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { DocumentEntityType } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard, AuthPrincipal } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

class DocumentMetadataDto { @IsString() title!: string; @IsString() category!: string; @IsEnum(DocumentEntityType) entityType!: DocumentEntityType; @IsString() fileName!: string; @IsString() mimeType!: string; @IsString() storageKey!: string; @IsNumber() sizeBytes!: number; @IsOptional() @IsObject() metadata?: Record<string, unknown>; }
class UpdateDocumentDto extends PartialType(DocumentMetadataDto) {}
type RequestWithUser = { user: AuthPrincipal };
@ApiTags('GED')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}
  @Get('trash') @RequirePermission('documents', 'view') trash() { return this.documents.trash(); }
  @Get() @RequirePermission('documents', 'view') list(@Query('search') search?: string) { return this.documents.list(search); }
  @Delete(':id/permanent') @RequirePermission('documents', 'delete_permanent') permanentlyRemove(@Param('id') id: string) { return this.documents.removePermanently(id); }
  @Post('metadata') @RequirePermission('documents', 'create') metadata(@Body() dto: DocumentMetadataDto, @Req() req: RequestWithUser) { return this.documents.createMetadata({ ...dto, createdById: req.user.sub }); }
  @Patch(':id') @RequirePermission('documents', 'update') update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) { return this.documents.update(id, dto); }
  @Delete(':id') @RequirePermission('documents', 'delete') remove(@Param('id') id: string) { return this.documents.remove(id); }
  @Post(':id/restore') @RequirePermission('documents', 'update') restore(@Param('id') id: string) { return this.documents.restore(id); }
}
