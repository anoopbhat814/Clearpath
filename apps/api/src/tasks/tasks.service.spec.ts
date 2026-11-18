import { NotFoundException } from '@nestjs/common';
import { TaskService } from './tasks.service';

describe('TaskService', () => {
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
    task: model,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    patient: { findUnique: jest.fn() },
    referral: { count: jest.fn() },
    auditLog: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  let service: TaskService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TaskService(prisma);
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

  it('derives a due date from the board SLA when none is given', async () => {
    (prisma as any).taskBoard = { findUnique: jest.fn().mockResolvedValue({ id: 'b1', slaHours: 6 }) };
    model.create.mockResolvedValue({ id: 't1' });
    const before = Date.now();
    await service.create({ boardId: 'b1', title: 'Arrange transport' } as any, user);
    const data = model.create.mock.calls[0][0].data;
    expect(data.priority).toBe('NORMAL');
    expect(data.dueAt.getTime() - before).toBeGreaterThanOrEqual(6 * 3_600_000 - 1000);
    expect(data.reporterId).toBe('u1');
  });

  it('stamps completedAt only when moving to DONE', async () => {
    model.findFirst.mockResolvedValue({ id: 't1' });
    model.update.mockResolvedValue({});
    await service.move('t1', { status: 'DONE' }, user);
    expect(model.update.mock.calls[0][0].data.completedAt).toBeInstanceOf(Date);
    await service.move('t1', { status: 'IN_PROGRESS' }, user);
    expect(model.update.mock.calls[1][0].data.completedAt).toBeNull();
  });
});
