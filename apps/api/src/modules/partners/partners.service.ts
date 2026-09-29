import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePartnerDto } from './partners.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}
  trash() { return this.prisma.partner.findMany({ where: { deletedAt: { not: null } }, orderBy: { updatedAt: 'desc' } }); }
  list(search?: string) { return this.prisma.partner.findMany({ where: { deletedAt: null, ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}) }, include: { _count: { select: { missions: true, deliveries: true } } }, orderBy: { name: 'asc' } }); }
  async create(dto: CreatePartnerDto) {
    const sequence = await this.prisma.codeSequence.upsert({ where: { prefix: 'PAR' }, create: { prefix: 'PAR', nextValue: 2 }, update: { nextValue: { increment: 1 } } });
    return this.prisma.partner.create({ data: { code: `PAR-${String(sequence.nextValue - 1).padStart(6, '0')}`, ...dto, address: dto.address as Prisma.InputJsonValue } });
  }
  update(id: string, dto: Partial<CreatePartnerDto>) { return this.prisma.partner.update({ where: { id }, data: { ...dto, address: dto.address as Prisma.InputJsonValue } }); }
  archive(id: string) { return this.prisma.partner.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } }); }
  removePermanently(id: string) { return this.prisma.partner.delete({ where: { id } }); }
  restore(id: string) { return this.prisma.partner.update({ where: { id }, data: { deletedAt: null, isActive: true } }); }
}
