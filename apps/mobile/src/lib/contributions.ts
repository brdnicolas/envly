import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

import { invalidate } from '@/hooks/use-api';
import { api } from '@/lib/api';
import type { Contribution } from '@/lib/types';

// Group-gift pledges are anonymous like reservations: a token alone withdraws one, kept on the device.
const KEY = 'envly.contributions';
type Tokens = Record<string, string>; // contributionId → token

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

/** Contribution ids made from this phone. */
export function useMyContributions() {
  const [tokens, setTokens] = useState<Tokens>(cache ?? {});
  useEffect(() => {
    void load().then(setTokens);
    listeners.add(setTokens);
    return () => void listeners.delete(setTokens);
  }, []);
  return tokens;
}

export async function contribute(wishId: string, collectionId: string, name: string, amount: number) {
  const res = await api<{ id: string; token: string; contributions: Contribution[] }>(`/api/wishes/${wishId}/contributions`, {
    method: 'POST',
    body: { name, amount },
  });
  await save({ ...(await load()), [res.id]: res.token });
  invalidate(`/api/collections/${collectionId}`);
  return res.contributions;
}

export async function withdraw(wishId: string, collectionId: string, contributionId: string) {
  const tokens = await load();
  const res = await api<{ contributions: Contribution[] }>(`/api/wishes/${wishId}/contributions`, {
    method: 'DELETE',
    body: { contributionId, token: tokens[contributionId] },
  });
  const { [contributionId]: _, ...rest } = tokens;
  await save(rest);
  invalidate(`/api/collections/${collectionId}`);
  return res.contributions;
}
