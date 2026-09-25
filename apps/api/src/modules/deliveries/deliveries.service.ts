import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}
  list(search?: string) { return this.prisma.delivery.findMany({ where: { deletedAt: null, ...(search ? { code: { contains: search, mode: 'insensitive' } } : {}) }, include: { partner: true, missions: { include: { mission: true } } }, orderBy: { scheduledAt: 'asc' } }); }
  updateStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED') { return this.prisma.delivery.update({ where: { id }, data: { status, deliveredAt: status === 'DELIVERED' ? new Date() : undefined } }); }
}
