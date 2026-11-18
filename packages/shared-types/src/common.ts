export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  path: string;
  requestId?: string;
  timestamp: string;
}

export type UserRole = 'ADMIN' | 'COORDINATOR' | 'CLINICIAN' | 'SCHEDULER' | 'BED_MANAGER' | 'ANALYST' | 'AUDITOR';

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
