import { UnauthorizedException } from '@nestjs/common';
import { hashPassword } from './password';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma: any = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  };
  const jwt: any = { signAsync: jest.fn().mockResolvedValue('access.jwt') };
  const config: any = { get: (k: string) => ({ 'jwt.accessTtl': '15m', 'jwt.refreshTtlDays': 14 } as any)[k] };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwt, config);
  });

  it('issues tokens for valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'ops@clearpath.example', active: true, role: 'COORDINATOR', organizationId: 'o1',
      firstName: 'Avery', lastName: 'Stone', passwordHash: await hashPassword('Correct-Horse-Battery-9', 4),
    });
    const res = await service.login('OPS@clearpath.example', 'Correct-Horse-Battery-9', { ip: '10.0.0.1' });
    expect(res.accessToken).toBe('access.jwt');
    expect(res.refreshToken.length).toBeGreaterThan(40);
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(prisma.refreshToken.create.mock.calls[0][0].data.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('uses one error for unknown users and bad passwords', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('x@clearpath.example', 'whatever-long')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects revoked refresh tokens', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({ id: 'r1', revokedAt: new Date(), expiresAt: new Date(Date.now() + 1e6), user: { active: true } });
    await expect(service.refresh('t'.repeat(30))).rejects.toThrow('Invalid refresh token');
  });

  it('rotates a valid refresh token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'r1', revokedAt: null, expiresAt: new Date(Date.now() + 1e6),
      user: { id: 'u1', email: 'a@clearpath.example', role: 'CLINICIAN', organizationId: 'o1', active: true },
    });
    await service.refresh('t'.repeat(30));
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({ where: { id: 'r1' }, data: { revokedAt: expect.any(Date) } });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });
});
