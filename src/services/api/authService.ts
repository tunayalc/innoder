import * as Keychain from 'react-native-keychain';
import { apiClient, requireData, type SessionTokens } from './apiClient';
import type { User } from '../../types';
import { clearPrivateFiles } from './privateFiles';

const SESSION_SERVICE = 'inno-association-session';
apiClient.setPersistence(async session => {
  if (!session) {
    await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
    return;
  }
  await Keychain.setGenericPassword('session', JSON.stringify(session), {
    service: SESSION_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
});
interface AuthResponse {
  user: User;
  token: string;
  accessToken?: string;
  refreshToken?: string;
}
interface RegisterRequest {
  name: string;
  email: string;
  eventLink?: string;
  noticeAccepted: boolean;
  noticeVersion: string;
  consentAccepted: boolean;
  consentVersion: string;
}

class AuthService {
  private restoring?: Promise<User | null>;
  async login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    await apiClient.clearSession();
    await clearPrivateFiles();
    const version = apiClient.getVersion();
    const session = requireData(
      await apiClient.post<AuthResponse>('/auth/login', credentials),
    );
    apiClient.assertSession(version);
    const accessToken = session.accessToken || session.token;
    if (!accessToken || !session.refreshToken)
      throw new Error('Geçersiz oturum yanıtı.');
    await apiClient.setSession({
      accessToken,
      refreshToken: session.refreshToken,
      rememberMe: Boolean(credentials.rememberMe),
    });
    return session;
  }
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = requireData(
      await apiClient.post<{ user: User }>('/auth/register', data),
    );
    return { user: response.user, token: '' };
  }
  async logout() {
    const version = apiClient.getVersion();
    try {
      if (apiClient.hasSession())
        await apiClient.post('/auth/logout', {
          refreshToken: apiClient.getRefreshToken(),
        });
    } finally {
      if (version === apiClient.getVersion()) {
        await apiClient.clearSession();
        await clearPrivateFiles();
      }
    }
  }
  async getCurrentUser(): Promise<User> {
    return requireData(await apiClient.get<User>('/auth/me'));
  }
  restoreUser(): Promise<User | null> {
    if (!this.restoring)
      this.restoring = this.restoreStoredUser().finally(() => {
        this.restoring = undefined;
      });
    return this.restoring;
  }
  private async restoreStoredUser(): Promise<User | null> {
    if (!apiClient.hasSession()) {
      const version = apiClient.getVersion();
      const saved = await Keychain.getGenericPassword({
        service: SESSION_SERVICE,
      });
      apiClient.assertSession(version);
      if (!saved) return null;
      let session: SessionTokens;
      try {
        session = JSON.parse(saved.password);
      } catch {
        await apiClient.clearSession();
        return null;
      }
      if (!session.accessToken || !session.refreshToken) {
        await apiClient.clearSession();
        return null;
      }
      await apiClient.setSession({ ...session, rememberMe: true });
    }
    return this.getCurrentUser();
  }
  async restoreSession() {
    return Boolean(await this.restoreUser());
  }
  async changePassword(currentPassword: string, newPassword: string) {
    const version = apiClient.getVersion();
    requireData(
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      }),
    );
    if (version === apiClient.getVersion()) await apiClient.clearSession();
  }
}
export const authService = new AuthService();
export default authService;
