import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MedicalStaffController } from './medical-staff.controller';
import { MedicalStaffService } from './medical-staff.service';

@Module({ imports: [AuthModule], controllers: [MedicalStaffController], providers: [MedicalStaffService], exports: [MedicalStaffService] })
export class MedicalStaffModule {}
