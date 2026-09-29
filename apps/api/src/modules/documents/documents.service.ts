import { Injectable } from '@nestjs/common';
import { Prisma, DocumentEntityType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}
  trash() { return this.prisma.document.findMany({ where: { deletedAt: { not: null } }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' } }); }
  list(search?: string) { return this.prisma.document.findMany({ where: { deletedAt: null, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { fileName: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }] } : {}) }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } }, orderBy: { createdAt: 'desc' } }); }
  async createMetadata(data: { title: string; category: string; entityType: DocumentEntityType; fileName: string; mimeType: string; storageKey: string; sizeBytes: number; metadata?: Record<string, unknown>; createdById: string }) {
    const sequence = await this.prisma.codeSequence.upsert({ where: { prefix: 'DOC' }, create: { prefix: 'DOC', nextValue: 2 }, update: { nextValue: { increment: 1 } } });
    return this.prisma.document.create({ data: { ...data, code: `DOC-${String(sequence.nextValue - 1).padStart(6, '0')}`, sizeBytes: BigInt(data.sizeBytes), metadata: data.metadata as Prisma.InputJsonValue } });
  }
  update(id: string, data: { title?: string; category?: string; entityType?: DocumentEntityType; metadata?: Record<string, unknown> }) {
    const { title, category, entityType, metadata } = data;
    return this.prisma.document.update({ where: { id }, data: { title, category, entityType, metadata: metadata as Prisma.InputJsonValue } });
  }
  remove(id: string) { return this.prisma.document.update({ where: { id }, data: { deletedAt: new Date() } }); }
  removePermanently(id: string) { return this.prisma.document.delete({ where: { id } }); }
  restore(id: string) { return this.prisma.document.update({ where: { id }, data: { deletedAt: null } }); }
  addVersion(documentId: string, data: { storageKey: string; sizeBytes: number; checksum?: string; changeNote?: string; createdById: string }) { return this.prisma.documentVersion.create({ data: { documentId, version: 1, ...data, sizeBytes: BigInt(data.sizeBytes) } }); }

  async archiveGeneratedPdf(input: { title: string; prescriptionId: string; storageKey: string; sizeBytes: number; checksum: string; createdById: string }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({ where: { prescriptionId: input.prescriptionId, category: 'Ordonnance PDF', deletedAt: null }, orderBy: { createdAt: 'desc' } });
      if (existing) {
        const latest = await tx.documentVersion.findFirst({ where: { documentId: existing.id }, orderBy: { version: 'desc' } });
        const version = (latest?.version ?? 0) + 1;
        await tx.documentVersion.create({ data: { documentId: existing.id, version, storageKey: input.storageKey, sizeBytes: BigInt(input.sizeBytes), checksum: input.checksum, changeNote: 'Régénération du PDF officiel', createdById: input.createdById } });
        return tx.document.update({ where: { id: existing.id }, data: { storageKey: input.storageKey, sizeBytes: BigInt(input.sizeBytes), checksum: input.checksum } });
      }
      const sequence = await tx.codeSequence.upsert({ where: { prefix: 'DOC' }, create: { prefix: 'DOC', nextValue: 2 }, update: { nextValue: { increment: 1 } } });
      const document = await tx.document.create({ data: { code: `DOC-${String(sequence.nextValue - 1).padStart(6, '0')}`, entityType: DocumentEntityType.PRESCRIPTION, category: 'Ordonnance PDF', title: input.title, fileName: `${input.title}.pdf`, mimeType: 'application/pdf', storageKey: input.storageKey, sizeBytes: BigInt(input.sizeBytes), checksum: input.checksum, prescriptionId: input.prescriptionId, createdById: input.createdById } });
      await tx.documentVersion.create({ data: { documentId: document.id, version: 1, storageKey: input.storageKey, sizeBytes: BigInt(input.sizeBytes), checksum: input.checksum, changeNote: 'PDF officiel initial', createdById: input.createdById } });
      return document;
    });
  }
}
