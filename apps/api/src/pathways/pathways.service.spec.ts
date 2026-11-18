import { NotFoundException } from '@nestjs/common';
import { CarePathwayService } from './pathways.service';

describe('CarePathwayService', () => {
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
    carePathway: model,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    patient: { findUnique: jest.fn() },
    referral: { count: jest.fn() },
    auditLog: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  let service: CarePathwayService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CarePathwayService(prisma);
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

  it('refuses to enroll into an unpublished pathway', async () => {
    model.findFirst.mockResolvedValue({ id: 'w1', published: false, steps: [{ position: 1 }] });
    await expect(service.enroll('w1', { patientId: 'p1' }, user)).rejects.toThrow(/not published/);
  });

  it('starts enrollments on the first step', async () => {
    model.findFirst.mockResolvedValue({ id: 'w1', published: true, steps: [{ position: 2 }, { position: 5 }] });
    (prisma as any).pathwayEnrollment = { create: jest.fn().mockResolvedValue({ id: 'e1' }) };
    await service.enroll('w1', { patientId: 'p1' }, user);
    expect((prisma as any).pathwayEnrollment.create.mock.calls[0][0].data.currentStep).toBe(2);
  });

  it('completes the enrollment after the last step', async () => {
    (prisma as any).pathwayEnrollment = {
      findUnique: jest.fn().mockResolvedValue({ id: 'e1', status: 'ACTIVE', currentStep: 5, pathway: { steps: [{ position: 2 }, { position: 5 }] } }),
      update: jest.fn().mockResolvedValue({}),
    };
    await service.advance('e1');
    expect((prisma as any).pathwayEnrollment.update.mock.calls[0][0].data.status).toBe('COMPLETED');
  });
});
