export type UserStatus = 'pending_verification' | 'verified';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  country?: string;
  city?: string;
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
