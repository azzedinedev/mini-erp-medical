import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, email: true, firstName: true, lastName: true, phone: true, locale: true, theme: true, status: true, totpEnabled: true, lastLoginAt: true, roles: { include: { role: { select: { id: true, name: true } } } } }, orderBy: { lastName: 'asc' } });
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
}
