import { NotFoundException } from '@nestjs/common';
import { ShiftService } from './shifts.service';

describe('ShiftService', () => {
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
    shift: model,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    patient: { findUnique: jest.fn() },
    referral: { count: jest.fn() },
    auditLog: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  let service: ShiftService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ShiftService(prisma);
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

  it('rejects an overlapping shift with violation details', async () => {
    (prisma as any).staffMember = { findUnique: jest.fn().mockResolvedValue({ id: 's1', maxWeeklyHours: 40 }) };
    model.findMany.mockResolvedValue([{ startsAt: new Date('2026-04-06T08:00Z'), endsAt: new Date('2026-04-06T16:00Z') }]);
    await expect(
      service.create({ staffId: 's1', startsAt: '2026-04-06T12:00:00Z', endsAt: '2026-04-06T18:00:00Z' } as any, user),
    ).rejects.toMatchObject({ response: { violations: expect.arrayContaining([expect.objectContaining({ code: 'OVERLAP' })]) } });
    expect(model.create).not.toHaveBeenCalled();
  });

  it('creates a compliant shift', async () => {
    (prisma as any).staffMember = { findUnique: jest.fn().mockResolvedValue({ id: 's1', maxWeeklyHours: 40 }) };
    model.findMany.mockResolvedValue([]);
    model.create.mockResolvedValue({ id: 'sh1' });
    await service.create({ staffId: 's1', startsAt: '2026-04-06T08:00:00Z', endsAt: '2026-04-06T16:00:00Z' } as any, user);
    expect(model.create).toHaveBeenCalled();
  });

  it('updates status after confirming existence', async () => {
    model.findFirst.mockResolvedValue({ id: 'sh1' });
    model.update.mockResolvedValue({ id: 'sh1', status: 'CONFIRMED' });
    await service.setStatus('sh1', 'CONFIRMED', user);
    expect(model.update).toHaveBeenCalledWith({ where: { id: 'sh1' }, data: { status: 'CONFIRMED' } });
  });
});
