import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

const selectUserState = (state: RootState) => state.user;

export const selectUser = createSelector(
  [selectUserState],
  (userState) => userState.user,
);

export const selectIsAuthenticated = createSelector(
  [selectUserState],
  (userState) => userState.isAuthenticated,
);

export const selectRememberMe = createSelector(
  [selectUserState],
  (userState) => userState.rememberMe,
);

export const selectUserRole = createSelector(
  [selectUser],
  (user) => user?.role ?? null,
);

export const selectIsAdmin = createSelector(
  [selectUserRole],
  (role) => role === 'admin',
);

export const selectIsCandidate = createSelector(
  [selectUserRole],
  (role) => role === 'candidate',
);

export const selectUserLoading = createSelector(
  [selectUserState],
  (userState) => userState.isLoading,
);

export const selectUserError = createSelector(
  [selectUserState],
  (userState) => userState.error,
);
