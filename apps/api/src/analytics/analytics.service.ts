import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { summarizeBeds } from '../beds/capacity';
import { ageInYears, hoursBetween, median, percentile, rate } from './metrics';
import { RiskClient } from './risk-client';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly risk: RiskClient,
  ) {}

  /** Headline numbers for the operations dashboard (cached for one minute). */
  overview() {
    return this.redis.remember('analytics:overview', 60, async () => {
      const [referralGroups, authGroups, beds, overdueTasks, openTasks] = await this.prisma.$transaction([
        this.prisma.referral.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
        this.prisma.priorAuthorization.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
        this.prisma.bed.findMany({ select: { status: true } }),
        this.prisma.task.count({ where: { status: { not: 'DONE' }, dueAt: { lt: new Date() } } }),
        this.prisma.task.count({ where: { status: { not: 'DONE' } } }),
      ]);
      return {
        referrals: Object.fromEntries(referralGroups.map((g) => [g.status, g._count._all])),
        authorizations: Object.fromEntries(authGroups.map((g) => [g.status, g._count._all])),
        capacity: summarizeBeds(beds),
        tasks: { open: openTasks, overdue: overdueTasks },
      };
    });
  }

  /** Time-to-triage statistics for referrals created in the last `days` days. */
  async referralFunnel(days: number) {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await this.prisma.referral.findMany({
      where: { createdAt: { gte: since } },
      select: { status: true, priority: true, createdAt: true, triagedAt: true, scheduledAt: true },
    });
    const triageHours = rows.filter((r) => r.triagedAt).map((r) => hoursBetween(r.createdAt, r.triagedAt as Date));
    const scheduled = rows.filter((r) => r.scheduledAt).length;
    return {
      windowDays: days,
      total: rows.length,
      triaged: triageHours.length,
      scheduled,
      triageMedianHours: median(triageHours),
      triageP90Hours: percentile(triageHours, 90),
      schedulingRate: rate(scheduled, rows.length),
      byPriority: ['EMERGENT', 'URGENT', 'ROUTINE'].map((p) => ({ priority: p, count: rows.filter((r) => r.priority === p).length })),
    };
  }

  async authorizationOutcomes(days: number) {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await this.prisma.priorAuthorization.findMany({
      where: { decidedAt: { gte: since } },
      select: { status: true, submittedAt: true, decidedAt: true },
    });
    const approved = rows.filter((r) => r.status === 'APPROVED').length;
    const turnaround = rows
      .filter((r) => r.submittedAt && r.decidedAt)
      .map((r) => hoursBetween(r.submittedAt as Date, r.decidedAt as Date));
    return {
      windowDays: days,
      decided: rows.length,
      approved,
      approvalRate: rate(approved, rows.length),
      turnaroundMedianHours: median(turnaround),
      turnaroundP90Hours: percentile(turnaround, 90),
    };
  }

  async patientRisk(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    const yearAgo = new Date(Date.now() - 365 * 86_400_000);
    const [admissions, openTasks, activeReferrals, denied, current] = await this.prisma.$transaction([
      this.prisma.bedAssignment.count({ where: { patientId, admittedAt: { gte: yearAgo } } }),
      this.prisma.task.count({ where: { patientId, status: { not: 'DONE' } } }),
      this.prisma.referral.count({ where: { patientId, status: { in: ['SUBMITTED', 'TRIAGED', 'SCHEDULED'] } } }),
      this.prisma.priorAuthorization.count({ where: { patientId, status: 'DENIED' } }),
      this.prisma.bedAssignment.findFirst({ where: { patientId, dischargedAt: null } }),
    ]);
    const los = current ? Math.max(0, Math.floor((Date.now() - current.admittedAt.getTime()) / 86_400_000)) : 0;
    const result = await this.risk.score({
      age: ageInYears(patient.dateOfBirth),
      priorAdmissions12m: admissions,
      openTasks,
      activeReferrals,
      deniedAuthorizations: denied,
      lengthOfStayDays: los,
    });
    await this.prisma.riskScore.create({
      data: { patientId, model: result.source, score: result.score, band: result.band, factors: result.factors },
    });
    return result;
  }

  /** Occupancy history for a ward, passed to the forecasting model. */
  async capacityForecast(wardId: string, horizonDays: number) {
    const beds = await this.prisma.bed.findMany({ where: { wardId }, select: { id: true, status: true } });
    if (beds.length === 0) throw new NotFoundException('Ward has no beds');
    const since = new Date(Date.now() - 28 * 86_400_000);
    const assignments = await this.prisma.bedAssignment.findMany({
      where: { bed: { wardId }, admittedAt: { gte: since } },
      select: { admittedAt: true, dischargedAt: true },
    });
    const staffed = beds.filter((b) => b.status !== 'BLOCKED').length;
    const history = Array.from({ length: 28 }, (_, i) => {
      const day = new Date(since.getTime() + (i + 1) * 86_400_000);
      const occupied = assignments.filter((a) => a.admittedAt <= day && (!a.dischargedAt || a.dischargedAt > day)).length;
      return { date: day.toISOString().slice(0, 10), occupied: Math.min(occupied, staffed), staffed };
    });
    return this.risk.forecastCapacity(history, horizonDays);
  }
}
