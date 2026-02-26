import type { AnyAction } from '@reduxjs/toolkit';
import type { ThunkAction } from '@reduxjs/toolkit';

import type { RootState } from '../index';
import type { User } from '../../types';
import { getBackend } from '../../services/backend';
import {
  setApplications,
  setCurrentApplication,
  setLoading as setApplicationLoading,
  setError as setApplicationError,
  clearApplications,
} from '../slices/applicationSlice';
import {
  setMessages,
  setLoading as setMessageLoading,
  setError as setMessageError,
  clearMessages,
} from '../slices/messageSlice';
import {
  setLogs,
  setLoading as setAuditLoading,
  setError as setAuditError,
  clearLogs,
} from '../slices/auditSlice';
import { getErrorMessage } from './errors';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

/**
 * Loads session-bound data (applications/messages/audit) from the selected backend.
 * This is triggered after login and on app start if a persisted user session exists.
 */
export const hydrateSession = (user: User): AppThunk => async (dispatch) => {
  const backend = getBackend();

  dispatch(setApplicationLoading(true));
  dispatch(setMessageLoading(true));
  dispatch(setAuditLoading(true));
  dispatch(setApplicationError(null));
  dispatch(setMessageError(null));
  dispatch(setAuditError(null));

  try {
    if (user.role === 'admin') {
      const apps = await backend.applications.listForAdmin();
      dispatch(setApplications(apps));
      dispatch(setCurrentApplication(null));

      const threads = await Promise.all(
        apps.map((a) => backend.messages.listByApplicationId({ applicationId: a.id })),
      );
      dispatch(setMessages(threads.flat()));

      const logs = await backend.audit.list();
      dispatch(setLogs(logs));
    } else {
      const apps = await backend.applications.listForCandidate({ userId: user.id });
      dispatch(setApplications(apps));
      dispatch(setCurrentApplication(apps[0] || null));

      const threads = await Promise.all(
        apps.map((a) => backend.messages.listByApplicationId({ applicationId: a.id })),
      );
      dispatch(setMessages(threads.flat()));

      const logs = await backend.audit.list();
      dispatch(setLogs(logs));
    }
  } catch (err) {
    const msg = getErrorMessage(err, 'Veriler yüklenirken bir hata oluştu.');
    dispatch(setApplicationError(msg));
    dispatch(setMessageError(msg));
    dispatch(setAuditError(msg));
    // Keep state consistent (single source of truth is backend).
    dispatch(clearApplications());
    dispatch(clearMessages());
    dispatch(clearLogs());
  } finally {
    dispatch(setApplicationLoading(false));
    dispatch(setMessageLoading(false));
    dispatch(setAuditLoading(false));
  }
};
