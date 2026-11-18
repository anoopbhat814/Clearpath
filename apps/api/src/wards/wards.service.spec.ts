import { NotFoundException } from '@nestjs/common';
import { WardService } from './wards.service';

describe('WardService', () => {
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
    ward: model,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    patient: { findUnique: jest.fn() },
    referral: { count: jest.fn() },
    auditLog: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  let service: WardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WardService(prisma);
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

  it('summarizes occupancy for a ward', async () => {
    model.findFirst.mockResolvedValue({ id: 'w1' });
    (prisma as any).bed = { findMany: jest.fn().mockResolvedValue([{ status: 'OCCUPIED' }, { status: 'AVAILABLE' }]) };
    await expect(service.occupancy('w1', user)).resolves.toMatchObject({ total: 2, occupied: 1, occupancyRate: 0.5 });
  });

  it('builds a per-ward overview', async () => {
    model.findMany.mockResolvedValue([{ id: 'w1', name: 'North 3', type: 'MEDICAL', beds: [{ status: 'OCCUPIED' }] }]);
    const rows = await service.overview();
    expect(rows[0]).toMatchObject({ name: 'North 3', occupied: 1, level: 'critical' });
  });
});
