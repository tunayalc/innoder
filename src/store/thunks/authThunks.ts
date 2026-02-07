import type { AnyAction } from '@reduxjs/toolkit';
import type { ThunkAction } from '@reduxjs/toolkit';

import type { RootState } from '../index';
import type { User } from '../../types';
import { getBackend } from '../../services/backend';
import { setUser, clearUser, setLoading, setError } from '../slices/userSlice';
import { clearApplications } from '../slices/applicationSlice';
import { clearMessages } from '../slices/messageSlice';
import { clearLogs } from '../slices/auditSlice';
import { getErrorMessage } from './errors';
import { hydrateSession } from './sessionThunks';
import { ensureDraftApplication } from './applicationThunks';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

export const loginCandidate =
  (params: { email: string; password: string }): AppThunk =>
  async (dispatch) => {
    const backend = getBackend();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const user = await backend.auth.loginCandidate(params);
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
    phone?: string;
    country?: string;
    city?: string;
    password: string;
    kvkkAccepted: boolean;
  }): AppThunk =>
  async (dispatch) => {
    const backend = getBackend();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const user = await backend.auth.registerCandidate(params);
      dispatch(setUser(user));
      // Create a draft application so the checklist & document flow is immediately usable.
      dispatch(ensureDraftApplication({ programId: 'prog-a' }));
      dispatch(hydrateSession(user));
    } catch (err) {
      dispatch(setError(getErrorMessage(err, 'Kayıt oluşturulamadı.')));
    } finally {
      dispatch(setLoading(false));
    }
  };

export const loginAdmin =
  (params: { username: string; password: string }): AppThunk =>
  async (dispatch) => {
    const backend = getBackend();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const user = await backend.auth.loginAdmin(params);
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
    // Backend logout is best-effort.
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
