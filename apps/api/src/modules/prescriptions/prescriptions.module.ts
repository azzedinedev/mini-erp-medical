import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({ imports: [DocumentsModule], controllers: [PrescriptionsController], providers: [PrescriptionsService], exports: [PrescriptionsService] })
export class PrescriptionsModule {}
