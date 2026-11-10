export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://envly.fr').replace(/\/$/, '');

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const MESSAGES: Record<string, string> = {
  'Invalid credentials': 'Email ou mot de passe incorrect.',
  'Email and password required': 'Email et mot de passe requis.',
  'Email already in use': 'Cet email est déjà utilisé.',
  'Name is required': 'Le nom est requis.',
  'Title and collection are required': 'Le titre et la collection sont requis.',
  'Could not extract product info. Please fill in the details manually.':
    "Impossible de lire ce produit. Complétez les infos manuellement.",
  'Failed to fetch URL. Please fill in the details manually.':
    "Ce site bloque la lecture automatique. Complétez les infos manuellement.",
  'Invalid URL.': 'Lien invalide.',
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return MESSAGES[e.message] ?? e.message;
  if (e instanceof TypeError) return 'Pas de connexion au serveur.';
  if (e instanceof Error && e.message) return e.message;
  return 'Une erreur est survenue.';
}

type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown };

export async function api<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (res.status === 401 && authToken) onUnauthorized?.();
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Erreur ${res.status}`);
  return data as T;
}

/** Opens product links through the site's /api/go redirect (affiliate links). */
export const productLink = (url: string) => `${API_URL}/api/go?url=${encodeURIComponent(url)}`;
export const publicCollectionUrl = (slug: string) => `${API_URL}/w/${slug}`;
export const publicProfileUrl = (slug: string) => `${API_URL}/u/${slug}`;

export function formatPrice(price: number | null | undefined, currency = 'EUR') {
  if (price == null) return null;
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(price);
  } catch {
    return `${price.toFixed(2)} €`;
  }
}

/** Extracts the first http(s) URL from shared text ("Regarde ça https://…"). */
export function extractUrl(text: string | null | undefined): string | null {
  const m = text?.match(/https?:\/\/[^\s<>"]+/i);
  return m ? m[0].replace(/[),.;]+$/, '') : null;
}
