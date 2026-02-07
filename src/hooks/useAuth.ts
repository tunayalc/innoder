import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser, selectIsAuthenticated, selectUserRole } from '../store/selectors';
import { User } from '../types';
import {
  loginCandidate as loginCandidateThunk,
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

  const loginCandidate = useCallback(
    (params: { email: string; password: string }) => {
      dispatch(loginCandidateThunk(params));
    },
    [dispatch],
  );

  const registerCandidate = useCallback(
    (params: {
      fullName: string;
      email: string;
      phone?: string;
      country?: string;
      city?: string;
      password: string;
      kvkkAccepted: boolean;
    }) => {
      dispatch(registerCandidateThunk(params));
    },
    [dispatch],
  );

  const loginAdmin = useCallback(
    (params: { username: string; password: string }) => {
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
    loginCandidate,
    registerCandidate,
    loginAdmin,
    logout,
    update,
  };
};
