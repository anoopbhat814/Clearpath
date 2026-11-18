import { NotFoundException } from '@nestjs/common';
import { BedService } from './beds.service';

describe('BedService', () => {
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
    bed: model,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    patient: { findUnique: jest.fn() },
    referral: { count: jest.fn() },
    auditLog: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  let service: BedService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BedService(prisma);
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

  it('admits a patient when the bed is claimed', async () => {
    model.findFirst.mockResolvedValue({ id: 'b1' });
    const tx = { bed: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) }, bedAssignment: { create: jest.fn().mockResolvedValue({ id: 'as1' }) } };
    prisma.$transaction.mockImplementationOnce((fn: any) => fn(tx));
    await expect(service.admit('b1', { patientId: 'p1' }, user)).resolves.toEqual({ id: 'as1' });
  });

  it('returns a conflict when another admit wins the race', async () => {
    model.findFirst.mockResolvedValue({ id: 'b1' });
    const tx = { bed: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) }, bedAssignment: { create: jest.fn() } };
    prisma.$transaction.mockImplementationOnce((fn: any) => fn(tx));
    await expect(service.admit('b1', { patientId: 'p1' }, user)).rejects.toThrow('Bed is not available');
    expect(tx.bedAssignment.create).not.toHaveBeenCalled();
  });

  it('moves a discharged bed to cleaning', async () => {
    model.findFirst.mockResolvedValue({ id: 'b1' });
    const tx = {
      bedAssignment: { findFirst: jest.fn().mockResolvedValue({ id: 'as1' }), update: jest.fn() },
      bed: { update: jest.fn().mockResolvedValue({ status: 'CLEANING' }) },
    };
    prisma.$transaction.mockImplementationOnce((fn: any) => fn(tx));
    await service.discharge('b1', user);
    expect(tx.bed.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { status: 'CLEANING' } });
  });

  it('will not free an occupied bed without discharge', async () => {
    model.findFirst.mockResolvedValue({ id: 'b1', status: 'OCCUPIED' });
    await expect(service.setStatus('b1', { status: 'AVAILABLE' }, user)).rejects.toThrow(/Discharge the patient/);
  });
});
