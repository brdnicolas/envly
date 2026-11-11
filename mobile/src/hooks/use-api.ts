import { File, Paths } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { api, errorMessage } from '@/lib/api';

// Stale-while-revalidate cache, persisted on disk: screens paint the last known
// data instantly (even right after launch), then refresh in the background.
const store = new File(Paths.document, 'api-cache.json');
const cache = new Map<string, unknown>(readStore());

function readStore(): [string, unknown][] {
  try {
    return store.exists ? (Object.entries(JSON.parse(store.textSync())) as [string, unknown][]) : [];
  } catch {
    return [];
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      store.write(JSON.stringify(Object.fromEntries(cache)));
    } catch {
      // Cache is best-effort; the network is the source of truth.
    }
  }, 400);
}

/** Sign-out: forget everything, on disk too. */
export function clearApiCache() {
  cache.clear();
  if (saveTimer) clearTimeout(saveTimer);
  try {
    if (store.exists) store.delete();
  } catch {}
}

export function invalidate(prefix: string) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
  persist();
}

/** Warm the cache for a screen the user is likely to open next. */
export function prefetch(path: string) {
  if (cache.has(path)) return;
  api(path)
    .then((d) => {
      cache.set(path, d);
      persist();
    })
    .catch(() => {});
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
        persist();
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
    if (path) {
      cache.set(path, next);
      persist();
    }
    setData(next);
  };

  // Cached data stays on screen if a background refresh fails (offline, flaky network).
  return {
    data,
    error: data === undefined ? error : null,
    refreshing,
    loading: data === undefined && !error,
    refresh: () => load(true),
    mutate,
  };
}
