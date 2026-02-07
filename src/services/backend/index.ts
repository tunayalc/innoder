import { appConfig } from '../../config/appConfig';
import type { InnoBackend } from './types';
import { createMockBackend } from './mock/mockBackend';
import { createRemoteBackend } from './remote/remoteBackend';

let backendInstance: InnoBackend | null = null;

export const getBackend = (): InnoBackend => {
  if (backendInstance) return backendInstance;
  backendInstance =
    appConfig.dataSource === 'remote' ? createRemoteBackend() : createMockBackend();
  return backendInstance;
};

