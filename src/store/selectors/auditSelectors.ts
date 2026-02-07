import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

const selectAuditState = (state: RootState) => state.audit;

export const selectAuditLogs = createSelector(
  [selectAuditState],
  (auditState) => auditState.logs
);

export const selectAuditLogsByTarget = (targetId: string) =>
  createSelector([selectAuditLogs], (logs) =>
    logs.filter((l) => l.targetId === targetId)
  );

export const selectAuditLoading = createSelector(
  [selectAuditState],
  (auditState) => auditState.isLoading
);
