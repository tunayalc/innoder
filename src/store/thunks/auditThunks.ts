import type { AnyAction } from '@reduxjs/toolkit';
import type { ThunkAction } from '@reduxjs/toolkit';

import type { RootState } from '../index';
import { getBackend } from '../../services/backend';
import { setLogs, setLoading, setError } from '../slices/auditSlice';
import { getErrorMessage } from './errors';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

export const reloadAuditLogs = (): AppThunk => async (dispatch) => {
  const backend = getBackend();
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const logs = await backend.audit.list();
    dispatch(setLogs(logs));
  } catch (err) {
    dispatch(setError(getErrorMessage(err, 'Audit log yüklenemedi.')));
  } finally {
    dispatch(setLoading(false));
  }
};

