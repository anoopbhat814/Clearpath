import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const n = { findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() };
  const prisma: any = { notification: n, $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)) };
  const service = new NotificationsService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('only lists the caller notifications and honours unreadOnly', async () => {
    n.findMany.mockResolvedValue([]);
    n.count.mockResolvedValue(0);
    await service.listMine('u1', { page: 1, pageSize: 10 } as any, true);
    expect(n.findMany.mock.calls[0][0].where).toEqual({ userId: 'u1', readAt: null });
  });

  it('treats re-reading an already read notification as success', async () => {
    n.updateMany.mockResolvedValue({ count: 0 });
    n.findFirst.mockResolvedValue({ id: 'n1' });
    await expect(service.markRead('u1', 'n1')).resolves.toEqual({ id: 'n1', read: true });
  });

  it('404s when the notification belongs to someone else', async () => {
    n.updateMany.mockResolvedValue({ count: 0 });
    n.findFirst.mockResolvedValue(null);
    await expect(service.markRead('u1', 'n9')).rejects.toThrow(NotFoundException);
  });

  it('marks everything read', async () => {
    n.updateMany.mockResolvedValue({ count: 4 });
    await expect(service.markAllRead('u1')).resolves.toEqual({ updated: 4 });
  });
});
