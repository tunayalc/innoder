import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

const selectApplicationState = (state: RootState) => state.application;

export const selectApplications = createSelector(
  [selectApplicationState],
  (appState) => appState.applications
);

export const selectCurrentApplication = createSelector(
  [selectApplicationState],
  (appState) => appState.currentApplication
);

export const selectApplicationById = (applicationId: string) =>
  createSelector([selectApplications], (applications) =>
    applications.find((app) => app.id === applicationId)
  );

export const selectApplicationsByStatus = (status: string) =>
  createSelector([selectApplications], (applications) =>
    applications.filter((app) => app.status === status)
  );

export const selectPendingApplications = createSelector(
  [selectApplications],
  (applications) =>
    applications.filter((app) => app.status === 'application_stage' && Boolean(app.submittedAt))
);

export const selectApplicationsNeedingFix = createSelector(
  [selectApplications],
  (applications) =>
    applications.filter((app) => app.documents.some((document) => document.status === 'missing' || document.status === 'wrong_format'))
);

export const selectApplicationLoading = createSelector(
  [selectApplicationState],
  (appState) => appState.isLoading
);

export const selectApplicationError = createSelector(
  [selectApplicationState],
  (appState) => appState.error
);
