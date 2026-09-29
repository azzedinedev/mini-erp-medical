import { Injectable } from '@nestjs/common';
import { Prisma, ReferenceKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferenceDataService {
  constructor(private readonly prisma: PrismaService) {}
  trashTypes() { return this.prisma.referenceType.findMany({ where: { archivedAt: { not: null } }, orderBy: { updatedAt: 'desc' } }); }
  trashMedications() { return this.prisma.medication.findMany({ where: { archivedAt: { not: null } }, orderBy: { updatedAt: 'desc' } }); }
  listTypes(kind?: ReferenceKind) { return this.prisma.referenceType.findMany({ where: { active: true, ...(kind ? { kind } : {}) }, orderBy: { code: 'asc' } }); }
  listMedications(search?: string) { return this.prisma.medication.findMany({ where: { active: true, ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { molecule: { contains: search, mode: 'insensitive' } }] } : {}) }, take: 50, orderBy: { name: 'asc' } }); }
  createMedication(data: { name: string; molecule?: string; form?: string; dosage?: string; unit?: string }) { return this.prisma.medication.create({ data: { ...data, code: `MED-${Date.now()}` } }); }
  updateMedication(id: string, data: Partial<{ name: string; molecule?: string; form?: string; dosage?: string; unit?: string }>) { return this.prisma.medication.update({ where: { id }, data }); }
  removeMedication(id: string) { return this.prisma.medication.update({ where: { id }, data: { active: false, archivedAt: new Date() } }); }
  restoreMedication(id: string) { return this.prisma.medication.update({ where: { id }, data: { active: true, archivedAt: null } }); }
  createType(data: { kind: ReferenceKind; code: string; labels: Record<string, string>; icon?: string; color?: string }) { return this.prisma.referenceType.create({ data: { ...data, labels: data.labels as Prisma.InputJsonValue } }); }
  updateType(id: string, data: Partial<{ kind: ReferenceKind; code: string; labels: Record<string, string>; icon?: string; color?: string }>) { return this.prisma.referenceType.update({ where: { id }, data: { ...data, labels: data.labels as Prisma.InputJsonValue } }); }
  removeType(id: string) { return this.prisma.referenceType.update({ where: { id }, data: { active: false, archivedAt: new Date() } }); }
  removeTypePermanently(id: string) { return this.prisma.referenceType.delete({ where: { id } }); }
  removeMedicationPermanently(id: string) { return this.prisma.medication.delete({ where: { id } }); }
  restoreType(id: string) { return this.prisma.referenceType.update({ where: { id }, data: { active: true, archivedAt: null } }); }
}
