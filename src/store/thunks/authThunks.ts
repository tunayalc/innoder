import type { AnyAction } from '@reduxjs/toolkit';
import type { ThunkAction } from '@reduxjs/toolkit';

import type { RootState } from '../index';
import type { User } from '../../types';
import { getBackend } from '../../services/backend';
import {
  setUser,
  clearUser,
  setLoading,
  setRememberMe,
  setError,
} from '../slices/userSlice';
import { clearApplications, setApplications } from '../slices/applicationSlice';
import { clearMessages } from '../slices/messageSlice';
import { clearLogs } from '../slices/auditSlice';
import { getErrorMessage } from './errors';
import {apiClient,ApiError,requireData} from '../../services/api/apiClient';

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

const finalizeLogin = async (
  dispatch: (action: unknown) => void,
  user: User,
  rememberMe = false,
) => {
  dispatch(setRememberMe(Boolean(rememberMe)));
  dispatch(setUser(user));
};

export const loginUser =
  (params: {
    identifier: string;
    password: string;
    rememberMe?: boolean;
  }): AppThunk =>
  async dispatch => {
    const backend = getBackend();
    const identifier = params.identifier.trim();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const user = identifier.includes('@')
        ? await backend.auth.loginCandidate({
            email: identifier,
            password: params.password,
            rememberMe: params.rememberMe,
          })
        : await backend.auth.loginAdmin({
            username: identifier,
            password: params.password,
            rememberMe: params.rememberMe,
          });

      await finalizeLogin(dispatch, user, params.rememberMe);
    } catch (err) {
      dispatch(setError(getErrorMessage(err, 'Giriş yapılamadı.')));
    } finally {
      dispatch(setLoading(false));
    }
  };

export const loginCandidate =
  (params: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): AppThunk =>
  async dispatch => {
    const backend = getBackend();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const user = await backend.auth.loginCandidate(params);
      await finalizeLogin(dispatch, user, params.rememberMe);
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
    eventLink?: string;
    kvkkAccepted: boolean;
    noticeAccepted: boolean;
    noticeVersion: string;
    consentVersion: string;
  }): AppThunk<Promise<RegisterCandidateResult>> =>
  async dispatch => {
    const backend = getBackend();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await backend.auth.registerCandidate(params);
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

export const loginAdmin =
  (params: {
    username: string;
    password: string;
    rememberMe?: boolean;
  }): AppThunk =>
  async dispatch => {
    const backend = getBackend();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const user = await backend.auth.loginAdmin(params);
      await finalizeLogin(dispatch, user, params.rememberMe);
    } catch (err) {
      dispatch(setError(getErrorMessage(err, 'Admin girişi yapılamadı.')));
    } finally {
      dispatch(setLoading(false));
    }
  };

export const logout = (): AppThunk => async (dispatch, getState) => {
  const backend = getBackend();

  dispatch(setLoading(true));
  dispatch(setError(null));
  dispatch(clearUser());
  dispatch(clearApplications());
  dispatch(clearMessages());
  dispatch(clearLogs());

  try {
    await backend.auth.logout();
  } catch {
    // ignore
  } finally {
    if (!getState().user.user) {
      dispatch(setLoading(false));
      dispatch(setError(null));
    }
  }
};

export const updateProfile =
  (patch: Partial<User>): AppThunk<Promise<boolean>> =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const user = getState().user.user;
    if (!user) return false;

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const updated = await backend.auth.updateProfile({
        userId: user.id,
        patch,
      });
      if (getState().user.user?.id !== user.id) return false;
      dispatch(setUser(updated));
      dispatch(
        setApplications(
          getState().application.applications.map(application =>
            application.userId === user.id
              ? {
                  ...application,
                  personalInfo: {
                    ...application.personalInfo,
                    fullName: updated.name,
                    birthDate: updated.birthDate,
                    nationality: updated.nationality,
                    identityType: updated.identityType,
                    identityNumber: updated.identityNumber,
                    passportNumber: updated.passportNumber,
                    pnrNumber: updated.pnrNumber,
                  },
                }
              : application,
          ),
        ),
      );
      return true;
    } catch (err) {
      if(getState().user.user?.id===user.id&&err instanceof ApiError&&err.code==='REVISION_CONFLICT'){
        try{const latest=requireData(await apiClient.get<User>('/auth/me'));if(getState().user.user?.id===user.id)dispatch(setUser(latest));}catch{ /* The form still retains unsaved input. */ }
      }
      dispatch(setError(getErrorMessage(err, 'Profil güncellenemedi.')));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  };
