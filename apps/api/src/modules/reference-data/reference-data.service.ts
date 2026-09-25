import { Injectable } from '@nestjs/common';
import { Prisma, ReferenceKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferenceDataService {
  constructor(private readonly prisma: PrismaService) {}
  listTypes(kind?: ReferenceKind) { return this.prisma.referenceType.findMany({ where: { active: true, ...(kind ? { kind } : {}) }, orderBy: { code: 'asc' } }); }
  listMedications(search?: string) { return this.prisma.medication.findMany({ where: { active: true, ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { molecule: { contains: search, mode: 'insensitive' } }] } : {}) }, take: 50, orderBy: { name: 'asc' } }); }
  createMedication(data: { name: string; molecule?: string; form?: string; dosage?: string; unit?: string }) { return this.prisma.medication.create({ data: { ...data, code: `MED-${Date.now()}` } }); }
  createType(data: { kind: ReferenceKind; code: string; labels: Record<string, string>; icon?: string; color?: string }) { return this.prisma.referenceType.create({ data: { ...data, labels: data.labels as Prisma.InputJsonValue } }); }
}
