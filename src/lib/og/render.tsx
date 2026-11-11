import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const GOLD = "#E8C872";

const asset = (f: string) => readFile(join(process.cwd(), "assets/og", f));

let cache: Promise<{ fonts: { name: string; data: Buffer; weight: 500 | 700 | 800; style: "normal" }[]; star: string }> | null = null;
function load() {
  cache ??= (async () => {
    const [m, b, x, star] = await Promise.all([asset("geist-500.woff"), asset("geist-700.woff"), asset("geist-800.woff"), asset("star.png")]);
    return {
      fonts: [
        { name: "Geist", data: m, weight: 500 as const, style: "normal" as const },
        { name: "Geist", data: b, weight: 700 as const, style: "normal" as const },
        { name: "Geist", data: x, weight: 800 as const, style: "normal" as const },
      ],
      star: `data:image/png;base64,${star.toString("base64")}`,
    };
  })();
  return cache;
}

/**
 * Social previews can't use WebP: ask Cloudinary for a JPEG crop. Other hosts are kept only
 * when they're clearly JPEG/PNG (satori can't decode WebP/AVIF).
 */
export function ogImage(url: string | null | undefined, w: number, h: number): string | null {
  if (!url) return null;
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/);
  if (m) return `${m[1]}w_${w},h_${h},c_fill,g_auto,f_jpg,q_80/${m[2].replace(/\.(webp|avif)$/i, ".jpg")}`;
  return /\.(jpe?g|png)(\?|$)/i.test(url) ? url : null;
}

/** Shared frame: dark background, Envly mark top-left, envly.fr bottom-left. */
export async function renderOg(children: React.ReactNode, opts: { gold?: boolean } = {}) {
  const { fonts, star } = await load();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Geist",
          color: "#f4f4f5",
          background: opts.gold
            ? "radial-gradient(80% 90% at 85% 0%, #3d3322 0%, #0b0b0c 62%)"
            : "radial-gradient(80% 90% at 85% 0%, #2a2a31 0%, #0b0b0c 62%)",
        }}>
        <div style={{ position: "absolute", top: 54, left: 64, display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={star} width={40} height={40} alt="" />
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>Envly</span>
        </div>
        <div style={{ position: "absolute", bottom: 50, left: 64, fontSize: 24, fontWeight: 500, color: "#8e8e96" }}>envly.fr</div>
        {children}
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}
