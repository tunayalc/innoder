import type { AnyAction } from '@reduxjs/toolkit';
import type { ThunkAction } from '@reduxjs/toolkit';

import type { RootState } from '../index';
import type { Document, PersonalInfo, ProgramDraftInput } from '../../types';
import { getBackend } from '../../services/backend';
import {
  setApplications,
  setCurrentApplication,
  setLoading as setApplicationLoading,
  setError as setApplicationError,
  updateApplication,
} from '../slices/applicationSlice';
import { getErrorMessage } from './errors';
import { reloadAuditLogs } from './auditThunks';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

export const ensureDraftApplication =
  (params: { program: ProgramDraftInput }): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const user = getState().user.user;
    if (!user) return;

    dispatch(setApplicationLoading(true));
    dispatch(setApplicationError(null));
    try {
      const app = await backend.applications.ensureDraft({
        userId: user.id,
        program: params.program,
        fullName: user.name,
      });
      const existingApps = getState().application.applications;
      const hasExisting = existingApps.some((item) => item.id === app.id);
      if (hasExisting) {
        dispatch(updateApplication(app));
      } else {
        dispatch(setApplications([app, ...existingApps]));
      }
      dispatch(setCurrentApplication(app));
    } catch (err) {
      dispatch(setApplicationError(getErrorMessage(err, 'Başvuru oluşturulamadı.')));
    } finally {
      dispatch(setApplicationLoading(false));
    }
  };

export const assignProgramToCandidate =
  (params: { userId: string; fullName: string; program: ProgramDraftInput }): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    dispatch(setApplicationLoading(true));
    dispatch(setApplicationError(null));
    try {
      const app = await backend.applications.assignProgram(params);
      const existingApps = getState().application.applications;
      const hasExisting = existingApps.some((item) => item.id === app.id);
      if (hasExisting) {
        dispatch(updateApplication(app));
      } else {
        dispatch(setApplications([app, ...existingApps]));
      }
      dispatch(reloadAuditLogs());
    } catch (err) {
      dispatch(setApplicationError(getErrorMessage(err, 'Program ataması yapılamadı.')));
    } finally {
      dispatch(setApplicationLoading(false));
    }
  };

export const updatePersonalInfoDraft =
  (params: { applicationId: string; patch: Partial<PersonalInfo>; programId: string }): AppThunk =>
  async (dispatch) => {
    const backend = getBackend();
    dispatch(setApplicationLoading(true));
    dispatch(setApplicationError(null));
    try {
      const app = await backend.applications.updatePersonalInfo(params);
      dispatch(updateApplication(app));
      dispatch(setCurrentApplication(app));
      dispatch(reloadAuditLogs());
    } catch (err) {
      dispatch(setApplicationError(getErrorMessage(err, 'Bilgiler kaydedilemedi.')));
    } finally {
      dispatch(setApplicationLoading(false));
    }
  };

export const submitApplication =
  (params: { applicationId: string }): AppThunk =>
  async (dispatch) => {
    const backend = getBackend();
    dispatch(setApplicationLoading(true));
    dispatch(setApplicationError(null));
    try {
      const app = await backend.applications.submit(params);
      dispatch(updateApplication(app));
      dispatch(setCurrentApplication(app));
      dispatch(reloadAuditLogs());
    } catch (err) {
      dispatch(setApplicationError(getErrorMessage(err, 'Başvuru gönderilemedi.')));
    } finally {
      dispatch(setApplicationLoading(false));
    }
  };

export const uploadDocument =
  (params: {
    applicationId: string;
    documentType: Document['type'];
    fileName: string;
    fileUrl?: string;
    pageCount: number;
    mimeType: string;
    qualityScore: number;
    parseResult?: string;
  }): AppThunk =>
  async (dispatch) => {
    const backend = getBackend();
    dispatch(setApplicationLoading(true));
    dispatch(setApplicationError(null));
    try {
      const res = await backend.applications.uploadDocument(params);
      dispatch(updateApplication(res.application));
      dispatch(setCurrentApplication(res.application));
      dispatch(reloadAuditLogs());
    } catch (err) {
      dispatch(setApplicationError(getErrorMessage(err, 'Belge yüklenemedi.')));
    } finally {
      dispatch(setApplicationLoading(false));
    }
  };

export const verifyDocument =
  (params: {
    applicationId: string;
    documentId: string;
    status: Document['status'];
    note: string;
  }): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const admin = getState().user.user;
    if (!admin) return;

    dispatch(setApplicationLoading(true));
    dispatch(setApplicationError(null));
    try {
      const res = await backend.applications.verifyDocument({
        applicationId: params.applicationId,
        documentId: params.documentId,
        status: params.status,
        note: params.note,
        verifiedByUserId: admin.id,
      });
      dispatch(updateApplication(res.application));
      dispatch(reloadAuditLogs());
    } catch (err) {
      dispatch(setApplicationError(getErrorMessage(err, 'Doğrulama kaydedilemedi.')));
    } finally {
      dispatch(setApplicationLoading(false));
    }
  };

export const approveApplication =
  (params: { applicationId: string }): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const admin = getState().user.user;
    if (!admin) return;

    dispatch(setApplicationLoading(true));
    dispatch(setApplicationError(null));
    try {
      const app = await backend.applications.approve({
        applicationId: params.applicationId,
        adminUserId: admin.id,
      });
      dispatch(updateApplication(app));
      dispatch(reloadAuditLogs());
    } catch (err) {
      dispatch(setApplicationError(getErrorMessage(err, 'Onay işlemi başarısız.')));
    } finally {
      dispatch(setApplicationLoading(false));
    }
  };

export const rejectApplication =
  (params: { applicationId: string; reason: string }): AppThunk =>
  async (dispatch, getState) => {
    const backend = getBackend();
    const admin = getState().user.user;
    if (!admin) return;

    dispatch(setApplicationLoading(true));
    dispatch(setApplicationError(null));
    try {
      const app = await backend.applications.reject({
        applicationId: params.applicationId,
        adminUserId: admin.id,
        reason: params.reason,
      });
      dispatch(updateApplication(app));
      dispatch(reloadAuditLogs());
    } catch (err) {
      dispatch(setApplicationError(getErrorMessage(err, 'Reddetme işlemi başarısız.')));
    } finally {
      dispatch(setApplicationLoading(false));
    }
  };

/**
 * Admin refresh for list screen (includes filters).
 */
export const loadAdminApplications =
  (filters: {
    status: string;
    programId: string;
    hasIssues: boolean;
    createdAfterISO: string;
    query: string;
  } = {
    status: '',
    programId: '',
    hasIssues: undefined as unknown as boolean,
    createdAfterISO: '',
    query: '',
  }): AppThunk =>
  async (dispatch) => {
    const backend = getBackend();
    dispatch(setApplicationLoading(true));
    dispatch(setApplicationError(null));
    try {
      const apps = await backend.applications.listForAdmin(filters as any);
      dispatch(setApplications(apps));
    } catch (err) {
      dispatch(setApplicationError(getErrorMessage(err, 'Başvurular yüklenemedi.')));
    } finally {
      dispatch(setApplicationLoading(false));
    }
  };
