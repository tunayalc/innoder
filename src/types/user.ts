import type { EuropassCvProfile } from './application';

export type UserStatus = 'verified';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  country?: string;
  city?: string;
  birthDate?: string;
  identityNumber?: string;
  passportNumber?: string;
  europassCv?: EuropassCvProfile;
  role: 'candidate' | 'admin';
  kvkkAccepted: boolean;
  consentVersion?: string;
  consentedAt?: string;
  status?: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
