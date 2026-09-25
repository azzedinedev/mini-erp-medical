import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}
  async all() { const rows = await this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } }); return Object.fromEntries(rows.map((row) => [row.key, row.value])); }
  async set(key: string, value: Prisma.InputJsonValue, updatedById?: string) { return this.prisma.systemSetting.upsert({ where: { key }, create: { key, value, updatedById }, update: { value, updatedById } }); }
}
