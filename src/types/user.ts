export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'candidate' | 'admin';
  kvkkAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
