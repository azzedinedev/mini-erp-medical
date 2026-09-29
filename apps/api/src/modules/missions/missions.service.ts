import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMissionDto } from './missions.dto';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}
  trash() { return this.prisma.mission.findMany({ where: { deletedAt: { not: null } }, include: { patient: true, partner: true }, orderBy: { updatedAt: 'desc' } }); }
  list(search?: string) { return this.prisma.mission.findMany({ where: { deletedAt: null, ...(search ? { OR: [{ code: { contains: search, mode: 'insensitive' } }, { title: { contains: search, mode: 'insensitive' } }] } : {}) }, include: { patient: true, assignedTo: true, partner: true, deliveries: { include: { delivery: true } } }, orderBy: { scheduledAt: 'asc' } }); }
  async create(dto: CreateMissionDto, createdById?: string) {
    const sequence = await this.prisma.codeSequence.upsert({ where: { prefix: 'MIS' }, create: { prefix: 'MIS', nextValue: 2 }, update: { nextValue: { increment: 1 } } });
    return this.prisma.mission.create({ data: { code: `MIS-${String(sequence.nextValue - 1).padStart(6, '0')}`, title: dto.title, patientId: dto.patientId, partnerId: dto.partnerId, assignedToId: dto.assignedToId, scheduledAt: new Date(dto.scheduledAt), estimatedCost: dto.estimatedCost, notes: dto.notes, createdById } });
  }
  updateStatus(id: string, status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') { return this.prisma.mission.update({ where: { id }, data: { status } }); }
  update(id: string, dto: Partial<CreateMissionDto>) { return this.prisma.mission.update({ where: { id }, data: { ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined } }); }
  removePermanently(id: string) { return this.prisma.mission.delete({ where: { id } }); }
  remove(id: string) { return this.prisma.mission.update({ where: { id }, data: { deletedAt: new Date() } }); }
  restore(id: string) { return this.prisma.mission.update({ where: { id }, data: { deletedAt: null } }); }
}
