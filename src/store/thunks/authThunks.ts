import type { AnyAction } from '@reduxjs/toolkit';
import type { ThunkAction } from '@reduxjs/toolkit';

import type { RootState } from '../index';
import type { User } from '../../types';
import { getBackend } from '../../services/backend';
import { setUser, clearUser, setLoading, setRememberMe, setError } from '../slices/userSlice';
import { clearApplications } from '../slices/applicationSlice';
import { clearMessages } from '../slices/messageSlice';
import { clearLogs } from '../slices/auditSlice';
import { getErrorMessage } from './errors';
import { hydrateSession } from './sessionThunks';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

export interface RegisterCandidateResult {
  ok: boolean;
  message: string;
}

const DEMO_CANDIDATE_CREDENTIALS = {
  email: 'aday@inno.com',
  password: '123123',
} as const;

export const loginCandidate =
  (params: { email: string; password: string; rememberMe?: boolean }): AppThunk =>
  async (dispatch) => {
    const backend = getBackend();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const user = await backend.auth.loginCandidate(params);
      dispatch(setRememberMe(Boolean(params.rememberMe)));
      dispatch(setUser(user));
      dispatch(hydrateSession(user));
    } catch (err) {
      dispatch(setError(getErrorMessage(err, 'Giriş yapılamadı.')));
    } finally {
      dispatch(setLoading(false));
    }
  };

export const registerCandidate =
  (params: {
    fullName: string;
    email: string;
    kvkkAccepted: boolean;
  }): AppThunk<Promise<RegisterCandidateResult>> =>
  async (dispatch) => {
    const backend = getBackend();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await backend.auth.registerCandidate(params);
      await backend.auth.requestCandidatePassword({
        fullName: params.fullName,
        email: params.email,
      });
      return {
        ok: true,
        message:
          'Kaydınız ve şifre talebiniz alındı. Inno Derneği onayından sonra giriş şifreniz gönderilecektir.',
      };
    } catch (err) {
      const message = getErrorMessage(err, 'Kayıt oluşturulamadı.');
      dispatch(setError(message));
      return { ok: false, message };
    } finally {
      dispatch(setLoading(false));
    }
  };

export const loginDemoCandidate =
  (rememberMe = false): AppThunk =>
  async (dispatch) => {
    dispatch(loginCandidate({ ...DEMO_CANDIDATE_CREDENTIALS, rememberMe }));
};

export const loginAdmin =
  (params: { username: string; password: string }): AppThunk =>
  async (dispatch) => {
    const backend = getBackend();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const user = await backend.auth.loginAdmin(params);
      dispatch(setRememberMe(false));
      dispatch(setUser(user));
      dispatch(hydrateSession(user));
    } catch (err) {
      dispatch(setError(getErrorMessage(err, 'Admin girişi yapılamadı.')));
    } finally {
      dispatch(setLoading(false));
    }
  };

export const logout = (): AppThunk => async (dispatch) => {
  const backend = getBackend();

  dispatch(setLoading(true));
  dispatch(setError(null));

  try {
    await backend.auth.logout();
  } catch {
    // ignore
  } finally {
    dispatch(clearUser());
    dispatch(clearApplications());
    dispatch(clearMessages());
    dispatch(clearLogs());
    dispatch(setLoading(false));
    dispatch(setError(null));
  }
};

export const updateProfile =
  (patch: Partial<User>): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const user = getState().user.user;
    if (!user) return;

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const updated = await backend.auth.updateProfile({
        userId: user.id,
        patch,
      });
      dispatch(setUser(updated));
    } catch (err) {
      dispatch(setError(getErrorMessage(err, 'Profil güncellenemedi.')));
    } finally {
      dispatch(setLoading(false));
    }
  };
