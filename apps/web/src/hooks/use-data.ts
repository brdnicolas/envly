import useSWR from "swr";

const CACHE_KEY = "envly-cache";
const TTL = 30 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCached(key: string): any {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const cache = JSON.parse(raw);
    const entry = cache[key];
    if (!entry || Date.now() - entry.t > TTL) return undefined;
    return entry.d;
  } catch {
    return undefined;
  }
}

export function useCollections() {
  return useSWR<Array<{
    id: string;
    name: string;
    description: string | null;
    slug: string;
    isPublic: boolean;
    createdAt: string;
    _count: { wishes: number };
    wishes: { imageUrl: string | null }[];
    role?: "owner" | "collaborator";
  }>>("/api/collections", { fallbackData: getCached("/api/collections") });
}

export function useCollection(id: string) {
  return useSWR(id ? `/api/collections/${id}` : null, {
    fallbackData: getCached(`/api/collections/${id}`),
  });
}

export function useProfile() {
  return useSWR<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    description: string | null;
    slug: string | null;
  }>("/api/profile", { fallbackData: getCached("/api/profile") });
}

export function useFollowStats() {
  return useSWR<{ followersCount: number; followingCount: number }>(
    "/api/follows/me?tab=stats",
    { fallbackData: getCached("/api/follows/me?tab=stats") }
  );
}

export function useFriendCollections() {
  return useSWR("/api/follows/me?tab=friends-collections", {
    fallbackData: getCached("/api/follows/me?tab=friends-collections"),
  });
}

export function useNotifications() {
  return useSWR<Array<{
    id: string;
    type: string;
    data: Record<string, string | undefined>;
    read: boolean;
    createdAt: string;
  }>>("/api/notifications", {
    refreshInterval: 30000,
    fallbackData: getCached("/api/notifications"),
  });
}
