import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './ui';

export const useCollection = <T>(fetchItems: () => Promise<T[]>) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const result = await fetchItems();
      if (request === sequence.current) setItems(result);
    } catch (cause) {
      if (request === sequence.current) setError(errorMessage(cause));
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [fetchItems]);
  useEffect(() => {
    void load();
    return () => {
      sequence.current++;
    };
  }, [load]);
  return { items, loading, error, load };
};
