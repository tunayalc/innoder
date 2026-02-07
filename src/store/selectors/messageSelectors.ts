import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

const selectMessageState = (state: RootState) => state.message;

export const selectMessages = createSelector(
  [selectMessageState],
  (msgState) => msgState.messages
);

export const selectMessagesByApplicationId = (applicationId: string) =>
  createSelector([selectMessages], (messages) =>
    messages
      .filter((m) => m.applicationId === applicationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );

export const selectMessageLoading = createSelector(
  [selectMessageState],
  (msgState) => msgState.isLoading
);

export const selectUnreadMessagesCount = (applicationId: string) =>
  createSelector([selectMessages], (messages) =>
    messages.filter((m) => m.applicationId === applicationId && !m.readAt).length
  );
