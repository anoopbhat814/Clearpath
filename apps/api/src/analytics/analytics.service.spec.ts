import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const prisma: any = {
    referral: { findMany: jest.fn(), count: jest.fn() },
    priorAuthorization: { findMany: jest.fn(), count: jest.fn() },
    patient: { findUnique: jest.fn() },
    bedAssignment: { count: jest.fn(), findFirst: jest.fn() },
    task: { count: jest.fn() },
    riskScore: { create: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const redis: any = { remember: jest.fn((_k: string, _t: number, fn: () => unknown) => fn()) };
  const risk: any = { score: jest.fn(), forecastCapacity: jest.fn() };
  const service = new AnalyticsService(prisma, redis, risk);

  beforeEach(() => jest.clearAllMocks());

  it('computes funnel statistics', async () => {
    const t0 = new Date('2026-05-01T00:00:00Z');
    prisma.referral.findMany.mockResolvedValue([
      { status: 'TRIAGED', priority: 'URGENT', createdAt: t0, triagedAt: new Date('2026-05-01T04:00:00Z'), scheduledAt: null },
      { status: 'SCHEDULED', priority: 'ROUTINE', createdAt: t0, triagedAt: new Date('2026-05-01T10:00:00Z'), scheduledAt: new Date('2026-05-05T00:00:00Z') },
      { status: 'SUBMITTED', priority: 'ROUTINE', createdAt: t0, triagedAt: null, scheduledAt: null },
    ]);
    const f = await service.referralFunnel(30);
    expect(f).toMatchObject({ total: 3, triaged: 2, scheduled: 1, triageMedianHours: 7 });
    expect(f.byPriority.find((p) => p.priority === 'ROUTINE')?.count).toBe(2);
  });

  it('computes authorization approval rate and turnaround', async () => {
    prisma.priorAuthorization.findMany.mockResolvedValue([
      { status: 'APPROVED', submittedAt: new Date('2026-05-01T00:00Z'), decidedAt: new Date('2026-05-02T00:00Z') },
      { status: 'DENIED', submittedAt: new Date('2026-05-01T00:00Z'), decidedAt: new Date('2026-05-03T00:00Z') },
    ]);
    const o = await service.authorizationOutcomes(90);
    expect(o).toMatchObject({ decided: 2, approved: 1, approvalRate: 0.5, turnaroundMedianHours: 36 });
  });

  it('scores a patient and stores the result', async () => {
    prisma.patient.findUnique.mockResolvedValue({ id: 'p1', dateOfBirth: new Date('1950-01-01') });
    prisma.bedAssignment.count.mockResolvedValue(2);
    prisma.task.count.mockResolvedValue(3);
    prisma.referral.count.mockResolvedValue(1);
    prisma.priorAuthorization.count.mockResolvedValue(0);
    prisma.bedAssignment.findFirst.mockResolvedValue(null);
    risk.score.mockResolvedValue({ score: 0.5, band: 'moderate', factors: [], source: 'analytics-service' });
    await service.patientRisk('p1');
    expect(risk.score.mock.calls[0][0]).toMatchObject({ priorAdmissions12m: 2, openTasks: 3, lengthOfStayDays: 0 });
    expect(prisma.riskScore.create).toHaveBeenCalled();
  });

  it('404s for unknown patients', async () => {
    prisma.patient.findUnique.mockResolvedValue(null);
    await expect(service.patientRisk('nope')).rejects.toThrow(NotFoundException);
  });
});
