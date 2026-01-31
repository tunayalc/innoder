import { apiClient } from './apiClient';
import { User } from '../../types';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  kvkkAccepted: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse | null> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data) {
      apiClient.setAuthToken(response.data.token);
      return response.data;
    }
    
    throw new Error(response.error || 'Login failed');
  }

  async register(data: RegisterRequest): Promise<AuthResponse | null> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    if (response.data) {
      apiClient.setAuthToken(response.data.token);
      return response.data;
    }
    
    throw new Error(response.error || 'Registration failed');
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {});
    apiClient.setAuthToken(null);
  }

  async refreshToken(): Promise<string | null> {
    const response = await apiClient.post<{ token: string }>('/auth/refresh', {});
    
    if (response.data) {
      apiClient.setAuthToken(response.data.token);
      return response.data.token;
    }
    
    return null;
  }

  async getCurrentUser(): Promise<User | null> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data || null;
  }
}

export const authService = new AuthService();
export default authService;
