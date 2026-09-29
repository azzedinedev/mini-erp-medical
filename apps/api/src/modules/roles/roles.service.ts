import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list() { return this.prisma.role.findMany({ include: { permissions: true, _count: { select: { users: true } } }, orderBy: { name: 'asc' } }); }

  create(name: string, description?: string, permissions: Array<{ module: string; action: string }> = []) {
    return this.prisma.role.create({ data: { name, description, permissions: { create: permissions } }, include: { permissions: true } });
  }

  async replacePermissions(id: string, permissions: Array<{ module: string; action: string }>) {
    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      return tx.role.update({ where: { id }, data: { permissions: { create: permissions } }, include: { permissions: true } });
    });
  }
}
