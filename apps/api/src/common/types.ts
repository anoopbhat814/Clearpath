import type { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export interface RequestWithContext {
  user?: AuthUser;
  requestId?: string;
  ip?: string;
  method: string;
  originalUrl: string;
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
}
