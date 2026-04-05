import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser, selectIsAuthenticated, selectUserRole } from '../store/selectors';
import { User } from '../types';
import {
  loginUser as loginUserThunk,
  loginCandidate as loginCandidateThunk,
  loginDemoCandidate as loginDemoCandidateThunk,
  loginAdmin as loginAdminThunk,
  registerCandidate as registerCandidateThunk,
  logout as logoutThunk,
  updateProfile as updateProfileThunk,
} from '../store/thunks/authThunks';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectUserRole);

  const login = useCallback(
    (params: { identifier: string; password: string; rememberMe?: boolean }) => {
      dispatch(loginUserThunk(params));
    },
    [dispatch],
  );

  const loginCandidate = useCallback(
    (params: { email: string; password: string; rememberMe?: boolean }) => {
      dispatch(loginCandidateThunk(params));
    },
    [dispatch],
  );

  const registerCandidate = useCallback(
    (params: {
      fullName: string;
      email: string;
      eventLink?: string;
      kvkkAccepted: boolean;
    }) => {
      return dispatch(registerCandidateThunk(params));
    },
    [dispatch],
  );

  const loginDemoCandidate = useCallback((rememberMe = false) => {
    dispatch(loginDemoCandidateThunk(rememberMe));
  }, [dispatch]);

  const loginAdmin = useCallback(
    (params: { username: string; password: string; rememberMe?: boolean }) => {
      dispatch(loginAdminThunk(params));
    },
    [dispatch],
  );

  const logout = useCallback(() => {
    dispatch(logoutThunk());
  }, [dispatch]);

  const update = useCallback(
    (data: Partial<User>) => {
      dispatch(updateProfileThunk(data));
    },
    [dispatch],
  );

  return {
    user,
    isAuthenticated,
    role,
    isAdmin: role === 'admin',
    isCandidate: role === 'candidate',
    login,
    loginCandidate,
    loginDemoCandidate,
    registerCandidate,
    loginAdmin,
    logout,
    update,
  };
};
