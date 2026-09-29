import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({ imports: [AuthModule, DocumentsModule], controllers: [PrescriptionsController], providers: [PrescriptionsService], exports: [PrescriptionsService] })
export class PrescriptionsModule {}
