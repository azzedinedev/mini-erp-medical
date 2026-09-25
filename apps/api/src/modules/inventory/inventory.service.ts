import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInventoryItemDto, StockMovementDto } from './inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string) {
    return this.prisma.inventoryItem.findMany({ where: { deletedAt: null, ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] } : {}) }, orderBy: { name: 'asc' } });
  }

  async create(dto: CreateInventoryItemDto) {
    const sequence = await this.prisma.codeSequence.upsert({ where: { prefix: 'INV' }, create: { prefix: 'INV', nextValue: 2 }, update: { nextValue: { increment: 1 } } });
    const number = sequence.nextValue - 1;
    return this.prisma.inventoryItem.create({ data: { code: `INV-${String(number).padStart(6, '0')}`, name: dto.name, sku: dto.sku, category: dto.category, unit: dto.unit, quantity: dto.quantity, minQuantity: dto.minQuantity ?? 0, location: dto.location, barcode: `INV-${String(number).padStart(6, '0')}` } });
  }

  async move(id: string, dto: StockMovementDto) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundException('Article introuvable');
    const quantity = new Prisma.Decimal(dto.quantity);
    const delta = dto.type === 'OUT' ? quantity.negated() : quantity;
    return this.prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({ data: { inventoryItemId: id, type: dto.type, quantity, reason: dto.reason, reference: dto.reference } });
      return tx.inventoryItem.update({ where: { id }, data: { quantity: { increment: delta } } });
    });
  }
}
