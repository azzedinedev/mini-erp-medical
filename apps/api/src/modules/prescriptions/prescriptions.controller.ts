import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto, SignPrescriptionDto } from './dto/prescription.dto';
import { JwtAuthGuard, AuthPrincipal } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PdfService } from '../../common/pdf/pdf.service';
import { StorageService } from '../../common/storage/storage.service';
import { DocumentsService } from '../documents/documents.service';

type RequestWithUser = { user: AuthPrincipal };
@ApiTags('ordonnances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService, private readonly pdf: PdfService, private readonly storage: StorageService, private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermission('prescriptions', 'view')
  list(@Query('page') page = 1, @Query('pageSize') pageSize = 20, @Query('search') search?: string) { return this.prescriptions.list(Number(page), Number(pageSize), search); }

  @Get(':id/pdf')
  @RequirePermission('prescriptions', 'export')
  async pdfDocument(@Param('id') id: string, @Req() req: RequestWithUser, @Res() response: Response): Promise<void> {
    const prescription = await this.prescriptions.findForPdf(id);
    const buffer = await this.pdf.renderOfficial({
      title: 'Ordonnance électronique',
      code: prescription.code,
      subtitle: `${prescription.patient.firstName} ${prescription.patient.lastName} · Prescripteur : Dr. ${prescription.prescriber.firstName} ${prescription.prescriber.lastName}`,
      lines: prescription.items.map((item) => ({ label: item.medication?.name ?? item.manualName ?? 'Médicament libre', value: [item.dosage, item.frequency, item.duration, item.instructions].filter(Boolean).join(' · ') })),
      traceabilityToken: prescription.verificationToken ?? prescription.code,
    });
    const stored = await this.storage.put(`pdf/prescriptions/${prescription.code}.pdf`, buffer);
    await this.documents.archiveGeneratedPdf({ title: prescription.code, prescriptionId: prescription.id, storageKey: stored.key, sizeBytes: stored.sizeBytes, checksum: stored.checksum, createdById: req.user.sub });
    response.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${prescription.code}.pdf"` });
    response.send(buffer);
  }

  @Post()
  @RequirePermission('prescriptions', 'create')
  create(@Body() dto: CreatePrescriptionDto) { return this.prescriptions.create(dto); }

  @Post(':id/sign')
  @RequirePermission('prescriptions', 'update')
  sign(@Param('id') id: string, @Body() dto: SignPrescriptionDto, @Req() req: RequestWithUser) { return this.prescriptions.sign(id, dto, req.user.sub); }

  @Post(':id/cancel')
  @RequirePermission('prescriptions', 'update')
  cancel(@Param('id') id: string) { return this.prescriptions.cancel(id); }
}
