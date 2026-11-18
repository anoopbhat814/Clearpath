import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, User } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { verifyPassword } from './password';
import { hashToken, newRefreshToken, refreshExpiry } from './token.util';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string, meta: { ip?: string; userAgent?: string } = {}) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Same error for unknown user and wrong password to avoid account enumeration.
    if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.prisma.auditLog.create({
      data: { actorId: user.id, action: AuditAction.LOGIN, entityType: 'User', entityId: user.id, ip: meta.ip },
    });
    return { user: this.publicUser(user), ...(await this.issueTokens(user, meta.userAgent)) };
  }

  async refresh(refreshToken: string, userAgent?: string): Promise<TokenPair> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date() || !record.user.active) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Rotation: the presented token is revoked and a new pair is issued.
    await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(record.user, userAgent);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: User, userAgent?: string): Promise<TokenPair> {
    const ttl = this.config.get<string>('jwt.accessTtl') ?? '15m';
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, org: user.organizationId },
      { expiresIn: ttl },
    );
    const { token, hash } = newRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        userAgent,
        expiresAt: refreshExpiry(this.config.get<number>('jwt.refreshTtlDays') ?? 14),
      },
    });
    return { accessToken, refreshToken: token, expiresIn: ttl };
  }

  private publicUser(user: User) {
    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
  }
}
