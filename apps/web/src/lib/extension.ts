"use client";

import { useSyncExternalStore } from "react";

export { EXTENSION_URL } from "@/lib/site";

/** The extension's content script sets `data-envly-extension="<version>"` on envly.fr pages. */
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-envly-extension"] });
  return () => obs.disconnect();
}

/**
 * - `installed`: the extension is running in this browser
 * - `supported`: desktop Chromium browser (Chrome, Edge, Brave, Arc, Opera…) that can install it
 * Both are false during SSR.
 */
export function useExtension() {
  const installed = useSyncExternalStore(
    subscribe,
    () => !!document.documentElement.dataset.envlyExtension,
    () => false
  );
  const supported = useSyncExternalStore(
    () => () => {},
    () => {
      const ua = navigator.userAgent;
      return /Chrome|Chromium|Edg\//.test(ua) && !/Mobile|Android|iPhone|iPad/.test(ua);
    },
    () => false
  );
  return { installed, supported };
}
