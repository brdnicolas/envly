"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";

const CACHE_KEY = "envly-cache";

function saveEntry(key: string, data: unknown) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[key] = { d: data, t: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SWRConfig
          value={{
            fetcher,
            revalidateOnFocus: false,
            revalidateIfStale: true,
            dedupingInterval: 5000,
            keepPreviousData: true,
            onSuccess: (data, key) => {
              if (typeof key === "string" && key.startsWith("/api/")) {
                saveEntry(key, data);
              }
            },
          }}
        >
          {children}
        </SWRConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}
