import type { Request } from 'express';

export type AuthenticatedUserRole =
  | 'USER'
  | 'ADMIN';

export type AuthenticatedUserStatus =
  | 'ACTIVE'
  | 'LOCKED'
  | 'UNVERIFIED'
  | 'DISABLED';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AuthenticatedUserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: AuthenticatedUserRole;
  status: AuthenticatedUserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest
  extends Request {
  user?: AuthenticatedUser;
}