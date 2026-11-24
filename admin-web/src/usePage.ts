import { useCallback, useEffect, useRef, useState } from 'react';
import type { Page } from './types';
import { errorMessage } from './ui';

export const usePage = <T>(fetchPage: () => Promise<Page<T>>) => {
  const [data, setData] = useState<Page<T>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const id = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const result = await fetchPage();
      if (id === sequence.current) setData(result);
    } catch (cause) {
      if (id === sequence.current) setError(errorMessage(cause));
    } finally {
      if (id === sequence.current) setLoading(false);
    }
  }, [fetchPage]);
  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 200);
    return () => {
      sequence.current++;
      clearTimeout(timer);
    };
  }, [load]);
  return { ...data, loading, error, load };
};
