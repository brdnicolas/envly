import { Share } from 'react-native';

import { invalidate } from '@/hooks/use-api';
import { api, API_URL } from '@/lib/api';
import type { Santa } from '@/lib/types';

export const santaLink = (code: string) => `${API_URL}/s/${code}`;

/** Every call returns the fresh Secret Santa; lists are refetched on next focus. */
async function call(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
  const res = await api<Santa>(path, { method, body });
  invalidate('/api/santas');
  return res;
}

export const createSanta = (input: { name: string; budget: number | null; date: string | null; collectionId: string | null; userIds?: string[] }) =>
  call('/api/santas', 'POST', input);
export const updateSanta = (id: string, patch: { name?: string; budget?: number | null; date?: string | null }) =>
  call(`/api/santas/${id}`, 'PATCH', patch);
export const deleteSanta = (id: string) => call(`/api/santas/${id}`, 'DELETE');
export const joinSanta = (id: string, collectionId: string | null) => call(`/api/santas/${id}/me`, 'PATCH', { collectionId });
export const leaveSanta = (id: string) => call(`/api/santas/${id}/me`, 'DELETE');
export const inviteToSanta = (id: string, userIds: string[]) => call(`/api/santas/${id}/invite`, 'POST', { userIds });
export const removeFromSanta = (id: string, userId: string) => call(`/api/santas/${id}/members/${userId}`, 'DELETE');
export const drawSanta = (id: string) => call(`/api/santas/${id}/draw`, 'POST');
export const joinByCode = (code: string, collectionId: string | null) => call(`/api/santas/join/${code}`, 'POST', { collectionId });

export function shareSantaLink(s: Pick<Santa, 'name' | 'inviteCode'>) {
  const url = santaLink(s.inviteCode);
  return Share.share({ message: `Rejoins le Secret Santa « ${s.name} » sur Envly 🎁 ${url}`, url });
}

export function santaMeta(s: Pick<Santa, 'budget' | 'date'>) {
  const parts: string[] = [];
  if (s.budget) parts.push(`${s.budget}\u00a0€ max`);
  if (s.date) parts.push(new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }));
  return parts.join(' · ');
}

/** Create my own private list for this Secret Santa (and share it there). */
export async function createSantaList(id: string) {
  const res = await api<{ collection: { id: string; name: string }; santa: Santa }>(`/api/santas/${id}/list`, { method: 'POST' });
  invalidate('/api/santas');
  invalidate('/api/collections');
  return res;
}

/** Copy wishes from my other lists into `collectionId`. */
export async function importWishes(collectionId: string, wishIds: string[]) {
  const res = await api<{ imported: number; skipped: number }>(`/api/collections/${collectionId}/import`, {
    method: 'POST',
    body: { wishIds },
  });
  invalidate('/api/collections');
  return res;
}
