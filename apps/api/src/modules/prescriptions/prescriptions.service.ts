import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrescriptionStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrescriptionDto, SignPrescriptionDto } from './dto/prescription.dto';

const allowedTransitions: Record<PrescriptionStatus, PrescriptionStatus[]> = {
  DRAFT: ['SIGNED', 'CANCELLED'],
  SIGNED: ['DISPENSED', 'CANCELLED'],
  DISPENSED: [],
  CANCELLED: [],
};

export function canTransitionPrescription(from: PrescriptionStatus, to: PrescriptionStatus): boolean {
  return allowedTransitions[from].includes(to);
}

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, pageSize = 20, search?: string) {
    const where: Prisma.PrescriptionWhereInput = { deletedAt: null, ...(search ? { OR: [{ code: { contains: search, mode: 'insensitive' } }, { patient: { lastName: { contains: search, mode: 'insensitive' } } }] } : {}) };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.prescription.findMany({ where, include: { patient: true, prescriber: true, items: { include: { medication: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.prescription.count({ where }),
    ]);
    return { data, meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } };
  }

  async create(dto: CreatePrescriptionDto) {
    const sequence = await this.prisma.codeSequence.upsert({ where: { prefix: 'ORD' }, create: { prefix: 'ORD', nextValue: 2 }, update: { nextValue: { increment: 1 } } });
    const sequenceNumber = sequence.nextValue - 1;
    return this.prisma.prescription.create({
      data: {
        code: `ORD-${String(sequenceNumber).padStart(6, '0')}`,
        patientId: dto.patientId,
        prescriberId: dto.prescriberId,
        instructions: dto.instructions,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        structuredText: dto.items as unknown as Prisma.InputJsonValue,
        items: { create: dto.items.map((item, index) => ({ ...item, sortOrder: index })) },
      },
      include: { items: true },
    });
  }

  async findForPdf(id: string) {
    const prescription = await this.prisma.prescription.findUnique({ where: { id }, include: { patient: true, prescriber: true, items: { include: { medication: true }, orderBy: { sortOrder: 'asc' } } } });
    if (!prescription) throw new NotFoundException('Ordonnance introuvable');
    return prescription;
  }

  async sign(id: string, dto: SignPrescriptionDto, signerId: string) {
    const prescription = await this.prisma.prescription.findUnique({ where: { id } });
    if (!prescription) throw new NotFoundException('Ordonnance introuvable');
    if (!canTransitionPrescription(prescription.status, 'SIGNED')) throw new BadRequestException('Cette ordonnance ne peut plus être signée');
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.prescription.update({ where: { id }, data: { status: 'SIGNED', signedById: signerId, signedAt: now, issuedAt: now, verificationToken: randomUUID() } });
      await tx.prescriptionSignature.create({ data: { prescriptionId: id, signerId, imageKey: `signatures/${id}-${now.getTime()}.png`, format: 'png' } });
      return updated;
    });
  }

  async cancel(id: string) {
    const prescription = await this.prisma.prescription.findUnique({ where: { id } });
    if (!prescription) throw new NotFoundException('Ordonnance introuvable');
    if (!canTransitionPrescription(prescription.status, 'CANCELLED')) throw new BadRequestException('Transition de statut impossible');
    return this.prisma.prescription.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
