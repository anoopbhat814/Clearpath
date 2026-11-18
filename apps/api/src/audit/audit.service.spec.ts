import { AuditService } from './audit.service';

describe('AuditService', () => {
  const prisma: any = {
    auditLog: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const service = new AuditService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('filters by actor, action and date range', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.auditLog.count.mockResolvedValue(0);
    await service.list({ page: 1, pageSize: 20, actorId: 'u1', action: 'READ', from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' } as any);
    const where = prisma.auditLog.findMany.mock.calls[0][0].where;
    expect(where.actorId).toBe('u1');
    expect(where.createdAt.gte).toEqual(new Date('2026-01-01T00:00:00Z'));
    expect(where.createdAt.lte).toEqual(new Date('2026-02-01T00:00:00Z'));
  });

  it('leaves the date filter undefined without a range', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.auditLog.count.mockResolvedValue(0);
    await service.list({ page: 1, pageSize: 20 } as any);
    expect(prisma.auditLog.findMany.mock.calls[0][0].where.createdAt).toBeUndefined();
  });

  it('exports CSV and records the export itself', async () => {
    prisma.auditLog.findMany.mockResolvedValue([
      { id: 'a1', createdAt: new Date('2026-01-01T00:00:00Z'), actorId: 'u1', action: 'READ', entityType: 'Patient', entityId: 'p1', ip: '10.0.0.1', requestId: 'r1' },
    ]);
    const csv = await service.exportCsv({ limit: 100 } as any, 'admin1');
    expect(csv.split('\n')[0]).toBe('id,createdAt,actorId,action,entityType,entityId,ip,requestId');
    expect(csv).toContain('a1,2026-01-01T00:00:00.000Z,u1,READ,Patient,p1');
    expect(prisma.auditLog.create.mock.calls[0][0].data).toMatchObject({ action: 'EXPORT', actorId: 'admin1' });
  });
});
