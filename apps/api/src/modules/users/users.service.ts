import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  trash() { return this.prisma.user.findMany({ where: { deletedAt: { not: null } }, select: { id: true, email: true, firstName: true, lastName: true, phone: true, locale: true, theme: true, status: true, totpEnabled: true, lastLoginAt: true, deletedAt: true }, orderBy: { updatedAt: 'desc' } }); }

  list() {
    return this.prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, email: true, firstName: true, lastName: true, phone: true, locale: true, theme: true, status: true, totpEnabled: true, lastLoginAt: true, roles: { include: { role: { select: { id: true, name: true } } } } }, orderBy: { lastName: 'asc' } });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password ?? randomUUID(), 12);
    return this.prisma.user.create({ data: { email: dto.email, firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone, passwordHash, locale: dto.locale ?? 'fr', theme: dto.theme ?? 'light', status: 'INVITED' }, select: { id: true, email: true, firstName: true, lastName: true, phone: true, locale: true, theme: true, status: true } });
  }

  async update(id: string, dto: Partial<CreateUserDto>) {
    const { password: _password, ...data } = dto;
    return this.prisma.user.update({ where: { id }, data, select: { id: true, email: true, firstName: true, lastName: true, phone: true, locale: true, theme: true, status: true } });
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: { ...dto },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, locale: true, theme: true, status: true },
    });
  }

  async archive(id: string) {
    return this.prisma.user.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: new Date() }, select: { id: true, status: true, deletedAt: true } });
  }

  async removePermanently(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async restore(id: string) {
    return this.prisma.user.update({ where: { id }, data: { status: 'ACTIVE', deletedAt: null }, select: { id: true, status: true, deletedAt: true } });
  }
}
