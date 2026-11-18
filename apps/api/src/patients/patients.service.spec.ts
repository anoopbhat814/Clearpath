import { NotFoundException } from '@nestjs/common';
import { PatientService } from './patients.service';

describe('PatientService', () => {
  const user: any = { id: 'u1', email: 'ops@clearpath.example', role: 'ADMIN', organizationId: 'org1' };
  const model = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const prisma: any = {
    patient: model,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    patient: { findUnique: jest.fn() },
    referral: { count: jest.fn() },
    auditLog: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  let service: PatientService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatientService(prisma);
  });

  it('lists with pagination metadata', async () => {
    model.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    model.count.mockResolvedValue(51);
    const page = await service.list({ page: 2, pageSize: 25 } as any, user);
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(51);
    expect(page.totalPages).toBe(3);
    expect(model.findMany.mock.calls[0][0]).toMatchObject({ skip: 25, take: 25 });
  });

  it('applies a text search when q is provided', async () => {
    model.findMany.mockResolvedValue([]);
    model.count.mockResolvedValue(0);
    await service.list({ page: 1, pageSize: 10, q: 'ab' } as any, user);
    expect(model.findMany.mock.calls[0][0].where.OR.length).toBeGreaterThan(0);
  });

  it('throws NotFoundException for a missing record', async () => {
    model.findFirst.mockResolvedValue(null);
    await expect(service.get('missing', user)).rejects.toThrow(NotFoundException);
  });

  it('returns an existing record', async () => {
    model.findFirst.mockResolvedValue({ id: 'x1' });
    await expect(service.get('x1', user)).resolves.toEqual({ id: 'x1' });
  });

  it('refuses to update a record that does not exist', async () => {
    model.findFirst.mockResolvedValue(null);
    await expect(service.update('nope', {} as any, user)).rejects.toThrow(NotFoundException);
    expect(model.update).not.toHaveBeenCalled();
  });

  it('merges referrals, authorizations and tasks newest first', async () => {
    model.findFirst.mockResolvedValue({ id: 'p1' });
    (prisma as any).referral.findMany = jest.fn().mockResolvedValue([{ id: 'r1', reference: 'REF-1', status: 'SUBMITTED', createdAt: new Date('2026-02-01') }]);
    (prisma as any).priorAuthorization = { findMany: jest.fn().mockResolvedValue([{ id: 'a1', reference: 'PA-1', status: 'PENDING', createdAt: new Date('2026-03-01') }]) };
    (prisma as any).task = { findMany: jest.fn().mockResolvedValue([{ id: 't1', title: 'Call patient', createdAt: new Date('2026-01-01') }]) };
    const events = await service.timeline('p1', user);
    expect(events.map((e) => e.type)).toEqual(['authorization', 'referral', 'task']);
  });
});
