import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { appConfig } from '../config/appConfig';
import { apiClient, requireData } from '../services/api/apiClient';

// Unread count for the signed-in user; refreshes when `refreshKey` changes or the app returns to the foreground.
export const useUnreadMessages = (refreshKey?: unknown) => {
  const [unread, setUnread] = useState<number | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (appConfig.dataSource !== 'remote') return;
    try {
      const summary = requireData(await apiClient.get<{ unread: number }>('/messages/unread-count'));
      setUnread(summary.unread);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Mesaj özeti alınamadı.');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return { unread, error, refresh };
};
