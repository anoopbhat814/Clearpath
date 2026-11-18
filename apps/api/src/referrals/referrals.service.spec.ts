import { NotFoundException } from '@nestjs/common';
import { ReferralService } from './referrals.service';

describe('ReferralService', () => {
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
    referral: model,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    patient: { findUnique: jest.fn() },
    referral: { count: jest.fn() },
    auditLog: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  let service: ReferralService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReferralService(prisma);
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

  it('refuses referrals for deceased patients', async () => {
    prisma.patient.findUnique.mockResolvedValue({ id: 'p1', deceased: true });
    await expect(service.create({ patientId: 'p1' } as any, user)).rejects.toThrow(/deceased/);
  });

  it('creates a referral with a generated reference', async () => {
    prisma.patient.findUnique.mockResolvedValue({ id: 'p1', deceased: false });
    model.create.mockResolvedValue({ id: 'r1' });
    await service.create({ patientId: 'p1', specialtyId: 's1', reason: 'Chest pain follow-up' } as any, user);
    expect(model.create.mock.calls[0][0].data.reference).toMatch(/^REF-\d{4}-[0-9A-F]{6}$/);
    expect(model.create.mock.calls[0][0].data.createdById).toBe('u1');
  });

  it('rejects illegal transitions', async () => {
    model.findFirst.mockResolvedValue({ id: 'r1', status: 'DRAFT' });
    await expect(service.transition('r1', { status: 'COMPLETED' } as any, user)).rejects.toThrow(/Cannot move referral/);
  });

  it('requires a schedule time when scheduling', async () => {
    model.findFirst.mockResolvedValue({ id: 'r1', status: 'TRIAGED' });
    await expect(service.transition('r1', { status: 'SCHEDULED' } as any, user)).rejects.toThrow(/scheduledAt/);
  });

  it('stamps triagedAt when triaging', async () => {
    model.findFirst.mockResolvedValue({ id: 'r1', status: 'SUBMITTED' });
    model.update.mockResolvedValue({ id: 'r1' });
    await service.transition('r1', { status: 'TRIAGED' } as any, user);
    expect(model.update.mock.calls[0][0].data.triagedAt).toBeInstanceOf(Date);
  });

  it('flags SLA breaches in the triage queue', async () => {
    model.findMany.mockResolvedValue([
      { id: 'a', priority: 'ROUTINE', createdAt: new Date(Date.now() - 80 * 3_600_000), triagedAt: null },
      { id: 'b', priority: 'EMERGENT', createdAt: new Date(), triagedAt: null },
    ]);
    const queue = await service.triageQueue(user);
    expect(queue.map((r: any) => r.id)).toEqual(['b', 'a']);
    expect(queue[1].slaBreached).toBe(true);
    expect(queue[0].slaBreached).toBe(false);
  });
});
