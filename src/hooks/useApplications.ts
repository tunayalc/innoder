import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectApplications,
  selectCurrentApplication,
  selectApplicationLoading,
} from '../store/selectors';
import {
  setApplications,
  setCurrentApplication,
  addApplication,
  updateApplication,
  updatePersonalInfo,
} from '../store/slices/applicationSlice';
import { Application, PersonalInfo } from '../types';

export const useApplications = () => {
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const currentApplication = useAppSelector(selectCurrentApplication);
  const isLoading = useAppSelector(selectApplicationLoading);

  const setAll = useCallback(
    (apps: Application[]) => {
      dispatch(setApplications(apps));
    },
    [dispatch]
  );

  const setCurrent = useCallback(
    (app: Application | null) => {
      dispatch(setCurrentApplication(app));
    },
    [dispatch]
  );

  const add = useCallback(
    (app: Application) => {
      dispatch(addApplication(app));
    },
    [dispatch]
  );

  const update = useCallback(
    (app: Application) => {
      dispatch(updateApplication(app));
    },
    [dispatch]
  );

  const updateInfo = useCallback(
    (applicationId: string, info: Partial<PersonalInfo>) => {
      dispatch(updatePersonalInfo({ applicationId, info }));
    },
    [dispatch]
  );

  return {
    applications,
    currentApplication,
    isLoading,
    setAll,
    setCurrent,
    add,
    update,
    updateInfo,
  };
};
