import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { api, API_URL, setAuthToken, setOnUnauthorized } from '@/lib/api';
import { clearApiCache } from '@/hooks/use-api';
import type { User } from '@/lib/types';

const TOKEN_KEY = 'envly.token';
const USER_KEY = 'envly.user';

type AuthState = { loading: boolean; token: string | null; user: User | null };

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  /** Google (or any method) through the website's sign-in page. Resolves false if cancelled. */
  signInWithBrowser: () => Promise<boolean>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, token: null, user: null });

  async function signOut() {
    await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
    setAuthToken(null);
    clearApiCache();
    setState({ loading: false, token: null, user: null });
  }

  async function signIn(email: string, password: string) {
    const res = await api<{ token: string; user: User }>('/api/auth/mobile', {
      method: 'POST',
      body: { email: email.trim(), password },
    });
    await storeSession(res.token, res.user);
  }

  async function storeSession(token: string, user: User) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    setAuthToken(token);
    setState({ loading: false, token, user });
  }

  async function signInWithBrowser() {
    const state = randomState();
    const result = await WebBrowser.openAuthSessionAsync(
      `${API_URL}/api/auth/mobile/authorize?state=${state}`,
      'envly://auth'
    );
    if (result.type !== 'success') return false;
    const params = new URL(result.url).searchParams;
    const token = params.get('token');
    if (!token || params.get('state') !== state) throw new Error('Connexion interrompue, réessaie.');
    setAuthToken(token);
    const user = await api<User>('/api/profile');
    await storeSession(token, user);
    return true;
  }

  async function signUp({ name, email, password }: { name: string; email: string; password: string }) {
    await api('/api/auth/register', { method: 'POST', body: { name: name.trim(), email: email.trim(), password } });
    await signIn(email, password);
  }

  useEffect(() => {
    (async () => {
      try {
        const [token, user] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        setAuthToken(token);
        setState({ loading: false, token, user: user ? (JSON.parse(user) as User) : null });
      } catch {
        setState({ loading: false, token: null, user: null });
      }
    })();
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => void signOut());
    return () => setOnUnauthorized(null);
  });

  return <AuthContext value={{ ...state, signIn, signInWithBrowser, signUp, signOut }}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

function randomState() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
