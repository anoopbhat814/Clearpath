import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports liveness', () => {
    const c = new HealthController({} as any, {} as any);
    expect(c.live().status).toBe('ok');
  });

  it('is ready when dependencies respond', async () => {
    const c = new HealthController({ $queryRaw: jest.fn().mockResolvedValue([1]) } as any, { client: { ping: jest.fn().mockResolvedValue('PONG') } } as any);
    await expect(c.ready()).resolves.toMatchObject({ status: 'ready' });
  });

  it('is degraded when redis is down', async () => {
    const c = new HealthController({ $queryRaw: jest.fn().mockResolvedValue([1]) } as any, { client: { ping: jest.fn().mockRejectedValue(new Error('down')) } } as any);
    await expect(c.ready()).rejects.toThrow(ServiceUnavailableException);
  });
});
