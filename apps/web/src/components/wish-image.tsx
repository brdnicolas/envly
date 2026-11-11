"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Product photo that never shifts the layout.
 *
 * The box is sized *before* the image arrives, from the best source available:
 *   1. the photo's pixel size stored with the wish (`imageWidth`/`imageHeight`, set when it was uploaded),
 *   2. the ratio measured the last time this browser loaded it (localStorage, for older wishes),
 *   3. a neutral 4:5 placeholder.
 * The photo then fades in.
 */

const KEY = "envly-image-ratios";
const DEFAULT_RATIO = 4 / 5;
const MAX_ENTRIES = 600;

let cache: Record<string, number> | null = null;
function ratios(): Record<string, number> {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache!;
}
function remember(src: string, ratio: number) {
  const all = ratios();
  if (all[src] === ratio) return;
  all[src] = ratio;
  const keys = Object.keys(all);
  if (keys.length > MAX_ENTRIES) for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) delete all[k];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

const noop = () => () => {};
// Clamp extreme panoramas/strips so one photo cannot dominate a column.
const clamp = (r: number) => Math.min(2, Math.max(0.5, r));

export function WishImage({
  src,
  fallbackSrc,
  width,
  height,
  alt,
  className,
}: {
  src: string;
  fallbackSrc?: string | null;
  width?: number | null;
  height?: number | null;
  alt: string;
  className?: string;
}) {
  // Known ratio for this photo (client only; the server renders the placeholder ratio).
  const known = useSyncExternalStore(noop, () => ratios()[src] ?? null, () => null);
  const [measured, setMeasured] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const stored = width && height ? clamp(width / height) : null;
  const ratio = stored ?? measured ?? known ?? DEFAULT_RATIO;

  const onLoad = (img: HTMLImageElement) => {
    if (!img.naturalWidth) return;
    if (!stored) {
      const r = clamp(img.naturalWidth / img.naturalHeight);
      remember(src, r);
      setMeasured(r);
    }
    setLoaded(true);
  };

  // The photo may already be complete (memory cache) before React attached onLoad.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) onLoad(img);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div className={cn("relative w-full overflow-hidden bg-muted/30", !loaded && !failed && "animate-pulse")} style={{ aspectRatio: ratio }}>
      {!failed && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          decoding="async"
          loading="lazy"
          onLoad={(e) => onLoad(e.currentTarget)}
          onError={(e) => {
            if (fallbackSrc && e.currentTarget.src !== fallbackSrc) e.currentTarget.src = fallbackSrc;
            else setFailed(true);
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center text-2xl text-muted-foreground/20">?</div>
      )}
    </div>
  );
}
