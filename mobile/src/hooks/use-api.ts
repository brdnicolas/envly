import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { api, errorMessage } from '@/lib/api';

const cache = new Map<string, unknown>();

export function clearApiCache() {
  cache.clear();
}

export function invalidate(prefix: string) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}

/** GET a JSON endpoint, show cached data instantly and refresh whenever the screen gains focus. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | undefined>(() => (path ? (cache.get(path) as T) : undefined));
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (manual = false) => {
      if (!path) return;
      if (manual) setRefreshing(true);
      try {
        const d = await api<T>(path);
        cache.set(path, d);
        setData(d);
        setError(null);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        if (manual) setRefreshing(false);
      }
    },
    [path]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const mutate = (next: T) => {
    if (path) cache.set(path, next);
    setData(next);
  };

  return { data, error, refreshing, loading: data === undefined && !error, refresh: () => load(true), mutate };
}
