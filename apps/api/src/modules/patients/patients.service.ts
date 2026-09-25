import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQuery } from '../../common/pipes/pagination.pipe';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQuery) {
    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
      ...(query.search ? { OR: [
        { code: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ] } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { [query.sort ?? 'createdAt']: query.direction } }),
      this.prisma.patient.count({ where }),
    ]);
    return { data, meta: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) } };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { OR: [{ id }, { code: id }], deletedAt: null },
      include: { locations: { include: { location: true } }, actions: { orderBy: { occurredAt: 'desc' }, take: 50 }, prescriptions: { orderBy: { createdAt: 'desc' }, take: 10 }, documents: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!patient) throw new NotFoundException('Dossier patient introuvable');
    return patient;
  }

  async create(dto: CreatePatientDto, actorId?: string) {
    const sequence = await this.prisma.codeSequence.upsert({ where: { prefix: 'PAT' }, create: { prefix: 'PAT', nextValue: 2 }, update: { nextValue: { increment: 1 } } });
    const number = sequence.nextValue - 1;
    return this.prisma.patient.create({
      data: {
        code: `PAT-${String(number).padStart(6, '0')}`,
        firstName: dto.firstName,
        lastName: dto.lastName,
        preferredName: dto.preferredName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        phone: dto.phone,
        email: dto.email,
        address: dto.address as Prisma.InputJsonValue,
        emergencyContact: dto.emergencyContact as Prisma.InputJsonValue,
        medicalHistory: dto.medicalHistory as Prisma.InputJsonValue,
        allergies: dto.allergies as Prisma.InputJsonValue,
        notes: dto.notes,
        createdById: actorId,
      },
    });
  }

  async update(id: string, dto: UpdatePatientDto, actorId?: string) {
    await this.ensure(id);
    return this.prisma.patient.update({ where: { id }, data: { ...dto, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined, updatedById: actorId, address: dto.address as Prisma.InputJsonValue, emergencyContact: dto.emergencyContact as Prisma.InputJsonValue, medicalHistory: dto.medicalHistory as Prisma.InputJsonValue, allergies: dto.allergies as Prisma.InputJsonValue } });
  }

  async archive(id: string) {
    await this.ensure(id);
    return this.prisma.patient.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
  }

  async remove(id: string) {
    await this.ensure(id);
    return this.prisma.patient.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async ensure(id: string) {
    const patient = await this.prisma.patient.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!patient) throw new NotFoundException('Dossier patient introuvable');
  }
}
