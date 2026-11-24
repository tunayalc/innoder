import type { EuropassCvProfile } from './application';

import type { IdentityType } from './application';

export type UserStatus = 'pending' | 'active' | 'disabled' | 'deletion_requested' | 'anonymized' | 'verified';

export interface User {
  revision?:number;
  id: string;
  email: string;
  name: string;
  eventLink?: string;
  phone?: string;
  country?: string;
  city?: string;
  birthDate?: string;
  nationality?: string;
  identityType?: IdentityType;
  identityNumber?: string;
  passportNumber?: string;
  pnrNumber?: string;
  europassCv?: EuropassCvProfile;
  role: 'candidate' | 'admin' | 'super_admin';
  username?: string;
  mustChangePassword?: boolean;
  kvkkAccepted: boolean;
  credentialRequestPending?: boolean;
  credentialRequestedAt?: string;
  credentialSentAt?: string;
  consentVersion?: string;
  consentedAt?: string;
  noticeVersion?: string;
  noticeAcceptedAt?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
}
