import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MedicalStaffService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.medicalStaff.findMany({ where: { deletedAt: null }, include: { consultations: { take: 3, orderBy: { scheduledAt: 'desc' } } }, orderBy: { lastName: 'asc' } }); }
  archive(id: string) { return this.prisma.medicalStaff.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } }); }
}
