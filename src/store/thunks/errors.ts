import { isBackendError } from '../../services/backend/types';

export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isBackendError(err)) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

