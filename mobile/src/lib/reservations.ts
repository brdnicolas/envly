import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { haptic } from '@/lib/haptics';

// Reservations are anonymous: the server hands back a token that alone can cancel it.
// Like the website's localStorage, we keep ours on the device.
const KEY = 'envly.reservations';
type Tokens = Record<string, string>;

let cache: Tokens | null = null;
const listeners = new Set<(t: Tokens) => void>();

async function load(): Promise<Tokens> {
  if (cache) return cache;
  try {
    cache = JSON.parse((await SecureStore.getItemAsync(KEY)) ?? '{}') as Tokens;
  } catch {
    cache = {};
  }
  return cache;
}

async function save(next: Tokens) {
  cache = next;
  listeners.forEach((l) => l(next));
  await SecureStore.setItemAsync(KEY, JSON.stringify(next));
}

/** Wish ids reserved from this phone. */
export function useMyReservations() {
  const [tokens, setTokens] = useState<Tokens>(cache ?? {});
  useEffect(() => {
    void load().then(setTokens);
    listeners.add(setTokens);
    return () => void listeners.delete(setTokens);
  }, []);
  return tokens;
}

export async function reserveWish(wishId: string, reservedBy: string) {
  const res = await api<{ token: string }>('/api/reserve', { method: 'POST', body: { wishId, reservedBy } });
  await save({ ...(await load()), [wishId]: res.token });
  haptic.success();
}

export async function cancelReservation(wishId: string) {
  const tokens = await load();
  const token = tokens[wishId];
  if (!token) return;
  await api('/api/reserve', { method: 'DELETE', body: { wishId, token } });
  const { [wishId]: _, ...rest } = tokens;
  await save(rest);
  haptic.success();
}
