import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './common/config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { PdfModule } from './common/pdf/pdf.module';
import { StorageModule } from './common/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PatientsModule } from './modules/patients/patients.module';
import { MedicalStaffModule } from './modules/medical-staff/medical-staff.module';
import { PartnersModule } from './modules/partners/partners.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { MissionsModule } from './modules/missions/missions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FinanceModule } from './modules/finance/finance.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig], envFilePath: ['../../.env', '.env'] }),
    PrismaModule,
    PdfModule,
    StorageModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PatientsModule,
    MedicalStaffModule,
    PartnersModule,
    ReferenceDataModule,
    PrescriptionsModule,
    InventoryModule,
    DeliveriesModule,
    MissionsModule,
    DocumentsModule,
    FinanceModule,
    SettingsModule,
  ],
})
export class AppModule {}
