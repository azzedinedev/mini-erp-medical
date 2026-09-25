import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}
  list(search?: string) { return this.prisma.partner.findMany({ where: { deletedAt: null, ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}) }, include: { _count: { select: { missions: true, deliveries: true } } }, orderBy: { name: 'asc' } }); }
  archive(id: string) { return this.prisma.partner.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } }); }
}
