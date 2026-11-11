"use client";

import { useSyncExternalStore } from "react";
import type { useRouter } from "next/navigation";

// Where to go after signing in / up: only same-origin paths (e.g. the mobile app's
// /api/auth/mobile/authorize, or a protected page the middleware bounced from).
export function getCallbackUrl(): string {
  if (typeof window === "undefined") return "/";
  const raw = new URLSearchParams(window.location.search).get("callbackUrl");
  if (!raw) return "/";
  try {
    const target = new URL(raw, window.location.origin);
    return target.origin === window.location.origin ? target.pathname + target.search : "/";
  } catch {
    return "/";
  }
}

export function goToCallback(router: ReturnType<typeof useRouter>) {
  const target = getCallbackUrl();
  // API routes must be a full navigation (they redirect to the app's scheme)
  if (target.startsWith("/api/")) window.location.replace(target);
  else router.replace(target);
}

/** `/signin` or `/signup`, keeping the current callbackUrl (sign-in from the app). */
export function withCallback(path: string): string {
  const cb = getCallbackUrl();
  return cb === "/" ? path : `${path}?callbackUrl=${encodeURIComponent(cb)}`;
}

/** Client-only version of withCallback, safe to use in render (no hydration mismatch). */
export function useCallbackHref(path: string): string {
  return useSyncExternalStore(
    noop,
    () => withCallback(path),
    () => path
  );
}

const noop = () => () => {};
