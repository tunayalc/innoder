import type { User } from '../../types';
import { getBackend } from '../../services/backend';
import { apiClient } from '../../services/api/apiClient';
import {
  setApplicationPage,
  setApplications,
  setCurrentApplication,
  setLoading,
  setError,
} from '../slices/applicationSlice';
import type { AppThunk } from './authThunks';
import { getErrorMessage } from './errors';

// Conversations and audit logs are loaded by their own screens, never at startup.
export const hydrateSession =
  (user: User): AppThunk =>
  async (dispatch, getState) => {
    const version = apiClient.getVersion();
    const current = () =>
      getState().user.user?.id === user.id &&
      apiClient.getVersion() === version;
    if (user.mustChangePassword) return;
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const backend = getBackend();
      if (user.role !== 'candidate' && backend.applications.listPage) {
        const page = await backend.applications.listPage({
          page: 1,
          pageSize: 25,
        });
        if (current()) {
          dispatch(setApplicationPage(page));
          dispatch(setCurrentApplication(null));
        }
        return;
      }
      const apps =
        user.role === 'candidate'
          ? await backend.applications.listForCandidate({ userId: user.id })
          : await backend.applications.listForAdmin({});
      if (!current()) return;
      dispatch(setApplications(apps));
      dispatch(
        setCurrentApplication(
          user.role === 'candidate' ? apps[0] || null : null,
        ),
      );
    } catch (error) {
      if (current())
        dispatch(
          setError(
            getErrorMessage(error, 'Veriler yüklenemedi. Tekrar deneyin.'),
          ),
        );
    } finally {
      if (current()) dispatch(setLoading(false));
    }
  };
