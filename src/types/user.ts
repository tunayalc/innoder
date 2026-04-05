import type { EuropassCvProfile } from './application';

export type UserStatus = 'verified';

export interface User {
  id: string;
  email: string;
  name: string;
  eventLink?: string;
  phone?: string;
  country?: string;
  city?: string;
  birthDate?: string;
  identityNumber?: string;
  passportNumber?: string;
  pnrNumber?: string;
  europassCv?: EuropassCvProfile;
  role: 'candidate' | 'admin';
  kvkkAccepted: boolean;
  credentialRequestPending?: boolean;
  credentialRequestedAt?: string;
  credentialSentAt?: string;
  consentVersion?: string;
  consentedAt?: string;
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
