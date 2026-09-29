import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicalStaffDto } from './medical-staff.dto';

@Injectable()
export class MedicalStaffService {
  constructor(private readonly prisma: PrismaService) {}
  trash() { return this.prisma.medicalStaff.findMany({ where: { deletedAt: { not: null } }, orderBy: { updatedAt: 'desc' } }); }
  list() { return this.prisma.medicalStaff.findMany({ where: { deletedAt: null }, include: { consultations: { take: 3, orderBy: { scheduledAt: 'desc' } } }, orderBy: { lastName: 'asc' } }); }
  async create(dto: CreateMedicalStaffDto) {
    return this.prisma.medicalStaff.create({ data: { ...dto, availability: dto.availability as Prisma.InputJsonValue } });
  }
  update(id: string, dto: Partial<CreateMedicalStaffDto>) { return this.prisma.medicalStaff.update({ where: { id }, data: { ...dto, availability: dto.availability as Prisma.InputJsonValue } }); }
  archive(id: string) { return this.prisma.medicalStaff.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } }); }
  removePermanently(id: string) { return this.prisma.medicalStaff.delete({ where: { id } }); }
  restore(id: string) { return this.prisma.medicalStaff.update({ where: { id }, data: { deletedAt: null, isActive: true } }); }
}
