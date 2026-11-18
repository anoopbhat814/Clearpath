import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function ctx(role?: UserRole): any {
  return {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  };
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('allows routes without role metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(ctx(UserRole.ANALYST))).toBe(true);
  });

  it('allows a listed role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SCHEDULER]);
    expect(guard.canActivate(ctx(UserRole.SCHEDULER))).toBe(true);
  });

  it('always allows admins', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SCHEDULER]);
    expect(guard.canActivate(ctx(UserRole.ADMIN))).toBe(true);
  });

  it('rejects other roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SCHEDULER]);
    expect(() => guard.canActivate(ctx(UserRole.ANALYST))).toThrow(ForbiddenException);
  });
});
