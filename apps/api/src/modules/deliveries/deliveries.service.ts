import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeliveryDto } from './deliveries.dto';

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}
  trash() { return this.prisma.delivery.findMany({ where: { deletedAt: { not: null } }, include: { partner: true }, orderBy: { updatedAt: 'desc' } }); }
  list(search?: string) { return this.prisma.delivery.findMany({ where: { deletedAt: null, ...(search ? { code: { contains: search, mode: 'insensitive' } } : {}) }, include: { partner: true, missions: { include: { mission: true } } }, orderBy: { scheduledAt: 'asc' } }); }
  async create(dto: CreateDeliveryDto) {
    const sequence = await this.prisma.codeSequence.upsert({ where: { prefix: 'LIV' }, create: { prefix: 'LIV', nextValue: 2 }, update: { nextValue: { increment: 1 } } });
    return this.prisma.delivery.create({ data: { code: `LIV-${String(sequence.nextValue - 1).padStart(6, '0')}`, partnerId: dto.partnerId, status: dto.status, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined, address: dto.address as Prisma.InputJsonValue, trackingNote: dto.trackingNote } });
  }
  update(id: string, dto: Partial<CreateDeliveryDto>) { return this.prisma.delivery.update({ where: { id }, data: { ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined, address: dto.address as Prisma.InputJsonValue } }); }
  updateStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED') { return this.prisma.delivery.update({ where: { id }, data: { status, deliveredAt: status === 'DELIVERED' ? new Date() : undefined } }); }
  async remove(id: string) {
    const delivery = await this.prisma.delivery.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!delivery) throw new NotFoundException('Livraison introuvable');
    return this.prisma.delivery.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  removePermanently(id: string) { return this.prisma.delivery.delete({ where: { id } }); }
  restore(id: string) { return this.prisma.delivery.update({ where: { id }, data: { deletedAt: null } }); }
}
