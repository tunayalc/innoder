import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser, selectIsAuthenticated, selectUserRole } from '../store/selectors';
import { setUser, clearUser, updateUser } from '../store/slices/userSlice';
import { User } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectUserRole);

  const login = useCallback(
    (userData: User) => {
      dispatch(setUser(userData));
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(clearUser());
  }, [dispatch]);

  const update = useCallback(
    (data: Partial<User>) => {
      dispatch(updateUser(data));
    },
    [dispatch]
  );

  return {
    user,
    isAuthenticated,
    role,
    isAdmin: role === 'admin',
    isCandidate: role === 'candidate',
    login,
    logout,
    update,
  };
};
