import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const dayStart = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const addDays = (date: Date, amount: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(period = 7) {
    const now = new Date();
    const today = dayStart(now);
    const tomorrow = addDays(today, 1);
    const days = period === 90 ? 90 : period === 30 ? 30 : 7;
    const rangeStart = addDays(today, -(days - 1));

    const [
      activePatients,
      todayMissions,
      pendingPrescriptions,
      inventoryItems,
      recentPatients,
      upcomingMissions,
      recentActivities,
      patientsForChart,
      missionsForChart,
      patientsByStatus,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.mission.count({ where: { deletedAt: null, scheduledAt: { gte: today, lt: tomorrow } } }),
      this.prisma.prescription.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      this.prisma.inventoryItem.findMany({ where: { deletedAt: null }, select: { id: true, quantity: true, minQuantity: true, name: true, code: true, unit: true } }),
      this.prisma.patient.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, code: true, firstName: true, lastName: true, birthDate: true, status: true, updatedAt: true, actions: { orderBy: { occurredAt: 'desc' }, take: 1, select: { summary: true, occurredAt: true } } },
      }),
      this.prisma.mission.findMany({
        where: { deletedAt: null, scheduledAt: { gte: now } },
        orderBy: { scheduledAt: 'asc' },
        take: 6,
        select: { id: true, code: true, title: true, scheduledAt: true, status: true, patient: { select: { code: true, firstName: true, lastName: true } }, assignedTo: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.auditEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, actor: { select: { firstName: true, lastName: true } }, patient: { select: { code: true, firstName: true, lastName: true } } },
      }),
      this.prisma.patient.findMany({ where: { deletedAt: null, createdAt: { gte: rangeStart } }, select: { createdAt: true } }),
      this.prisma.mission.findMany({ where: { deletedAt: null, scheduledAt: { gte: rangeStart, lt: tomorrow } }, select: { scheduledAt: true } }),
      this.prisma.patient.findMany({ where: { deletedAt: null }, select: { status: true } }),
    ]);

    const criticalStock = inventoryItems.filter((item) => new Prisma.Decimal(item.quantity).lte(item.minQuantity)).length;
    const chart = Array.from({ length: days }, (_, index) => {
      const date = addDays(rangeStart, index);
      const next = addDays(date, 1);
      const patients = patientsForChart.filter((item) => item.createdAt >= date && item.createdAt < next).length;
      const interventions = missionsForChart.filter((item) => item.scheduledAt >= date && item.scheduledAt < next).length;
      return { date: date.toISOString().slice(0, 10), patients, interventions };
    });

    const statusCounts = patientsByStatus.reduce<Record<string, number>>((counts, patient) => {
      counts[patient.status] = (counts[patient.status] ?? 0) + 1;
      return counts;
    }, {});

    return {
      generatedAt: now.toISOString(),
      period: days,
      cards: {
        activePatients,
        todayMissions,
        pendingPrescriptions,
        criticalStock,
      },
      recentPatients,
      upcomingMissions,
      recentActivities,
      patientStatus: statusCounts,
      chart,
      criticalItems: inventoryItems.filter((item) => new Prisma.Decimal(item.quantity).lte(item.minQuantity)).slice(0, 10),
    };
  }
}
