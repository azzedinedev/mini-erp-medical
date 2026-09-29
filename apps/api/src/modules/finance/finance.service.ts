import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface FinancialLineInput { label: string; quantity: number; unitPriceHt: number; discountRate?: number; vatRate?: number; }
export function calculateFinancialLine(input: FinancialLineInput) {
  const gross = input.quantity * input.unitPriceHt;
  const discountValue = gross * ((input.discountRate ?? 0) / 100);
  const baseHt = gross - discountValue;
  const vatBase = baseHt;
  const vatAmount = vatBase * ((input.vatRate ?? 0) / 100);
  return { discountValue, baseHt, vatBase, vatAmount, totalTtc: baseHt + vatAmount };
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}
  trash() { return this.prisma.financialDocument.findMany({ where: { deletedAt: { not: null } }, include: { lines: true, partner: true }, orderBy: { updatedAt: 'desc' } }); }
  list() { return this.prisma.financialDocument.findMany({ where: { deletedAt: null }, include: { lines: true, partner: true }, orderBy: { createdAt: 'desc' } }); }
  async update(id: string, data: { kind?: string; currency?: string; notes?: string; status?: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' }) {
    const { kind, currency, notes, status } = data;
    return this.prisma.financialDocument.update({ where: { id }, data: { kind, currency, notes, status } });
  }
  async remove(id: string) {
    return this.prisma.financialDocument.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  removePermanently(id: string) { return this.prisma.financialDocument.delete({ where: { id } }); }
  restore(id: string) { return this.prisma.financialDocument.update({ where: { id }, data: { deletedAt: null } }); }

  async create(data: { kind: string; currency: string; partnerId?: string; lines: FinancialLineInput[] }) {
    const calculated = data.lines.map((line) => ({ ...line, ...calculateFinancialLine(line) }));
    const totals = calculated.reduce((acc, line) => ({ ht: acc.ht + line.baseHt, vat: acc.vat + line.vatAmount, ttc: acc.ttc + line.totalTtc, discount: acc.discount + line.discountValue }), { ht: 0, vat: 0, ttc: 0, discount: 0 });
    const sequence = await this.prisma.codeSequence.upsert({ where: { prefix: 'FAC' }, create: { prefix: 'FAC', nextValue: 2 }, update: { nextValue: { increment: 1 } } });
    return this.prisma.financialDocument.create({ data: { code: `FAC-${String(sequence.nextValue - 1).padStart(6, '0')}`, kind: data.kind, currency: data.currency, partnerId: data.partnerId, subtotalHt: totals.ht, discountValue: totals.discount, vatTotal: totals.vat, totalTtc: totals.ttc, lines: { create: calculated.map((line) => ({ label: line.label, quantity: line.quantity, unitPriceHt: line.unitPriceHt, discountRate: line.discountRate ?? 0, discountValue: line.discountValue, baseHt: line.baseHt, vatRate: line.vatRate ?? 0, vatBase: line.vatBase, vatAmount: line.vatAmount, totalTtc: line.totalTtc })) } }, include: { lines: true } });
  }
}
