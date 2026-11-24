import type { FastifyRequest } from 'fastify';

export const ROLES = ['candidate', 'admin', 'super_admin'] as const;
export type Role = (typeof ROLES)[number];

export interface AuthUser {
  sessionId?: string;
  id: string;
  role: Role;
  tokenVersion: number;
}

export type AuthenticatedRequest = FastifyRequest & { authUser: AuthUser };

export interface PublicUser {
  revision?: number;
  id: string;
  email: string;
  username?: string;
  name: string;
  role: Role;
  status: string;
  mustChangePassword: boolean;
  credentialRequestPending?: boolean;
  credentialRequestedAt?: string;
  credentialSentAt?: string;
  eventLink?: string;
  phone?: string;
  country?: string;
  city?: string;
  birthDate?: string;
  nationality?: string;
  identityType?: string;
  identityNumber?: string;
  passportNumber?: string;
  pnrNumber?: string;
  kvkkAccepted: boolean;
  consentVersion?: string;
  consentedAt?: string;
  noticeVersion?: string;
  noticeAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}
