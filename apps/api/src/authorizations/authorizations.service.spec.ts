import { NotFoundException } from '@nestjs/common';
import { PriorAuthorizationService } from './authorizations.service';

describe('PriorAuthorizationService', () => {
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
    priorAuthorization: model,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    patient: { findUnique: jest.fn() },
    referral: { count: jest.fn() },
    auditLog: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  let service: PriorAuthorizationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PriorAuthorizationService(prisma);
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

  it('rejects coverage that belongs to another patient', async () => {
    (prisma as any).coverage = { findUnique: jest.fn().mockResolvedValue({ id: 'c1', patientId: 'other' }) };
    await expect(service.create({ patientId: 'p1', coverageId: 'c1' } as any, user)).rejects.toThrow(/does not belong/);
  });

  it('records an event with the status change', async () => {
    model.findFirst.mockResolvedValue({ id: 'a1', status: 'SUBMITTED' });
    model.update.mockResolvedValue({ id: 'a1' });
    (prisma as any).authorizationEvent = { create: jest.fn().mockResolvedValue({}) };
    await service.transition('a1', { status: 'DENIED', denialReason: 'Not covered' } as any, user);
    expect((prisma as any).authorizationEvent.create.mock.calls[0][0].data).toMatchObject({ fromStatus: 'SUBMITTED', toStatus: 'DENIED' });
    expect(model.update.mock.calls[0][0].data.decidedAt).toBeInstanceOf(Date);
  });

  it('requires a denial reason', async () => {
    model.findFirst.mockResolvedValue({ id: 'a1', status: 'SUBMITTED' });
    await expect(service.transition('a1', { status: 'DENIED' } as any, user)).rejects.toThrow(/denial reason/);
  });

  it('labels expiring approvals', async () => {
    model.findMany.mockResolvedValue([{ id: 'a1', validUntil: new Date(Date.now() + 2 * 86_400_000) }]);
    const rows = await service.expiring(7, user);
    expect(rows[0].expiry).toBe('expiring');
  });
});
