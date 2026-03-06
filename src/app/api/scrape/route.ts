import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as cheerio from "cheerio";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function fetchHTML(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    return res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractJsonLd($: cheerio.CheerioAPI) {
  const results: Record<string, string | number | string[] | null>[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
          const rawImages = Array.isArray(item.image) ? item.image : item.image ? [item.image] : [];
          const images = rawImages.map((img: unknown) => typeof img === "string" ? img : (img as Record<string, string>)?.url).filter(Boolean) as string[];
          results.push({
            title: item.name || null,
            description: item.description || null,
            imageUrl: images[0] || null,
            images,
            price: item.offers?.price ?? item.offers?.[0]?.price ?? null,
          });
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });

  return results[0] || null;
}

function extractOpenGraph($: cheerio.CheerioAPI) {
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text() ||
    "";

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  const imageUrl =
    $('meta[property="og:image"]').attr("content") || "";

  const priceText =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('meta[property="og:price:amount"]').attr("content") ||
    $('[class*="price"]').first().text() ||
    "";

  const price = priceText
    ? parseFloat(priceText.replace(/[^0-9.,]/g, "").replace(",", "."))
    : null;

  return {
    title: title.trim(),
    description: description.trim(),
    imageUrl: imageUrl.trim(),
    price: price && !isNaN(price) ? price : null,
  };
}

function extractAllImages($: cheerio.CheerioAPI, pageUrl: string, html: string): string[] {
  const images = new Set<string>();

  // OG images
  $('meta[property="og:image"]').each((_, el) => {
    const src = $(el).attr("content");
    if (src) images.add(src);
  });

  // <img> tags: src, data-src, srcset
  $('img[src]').each((_, el) => {
    const src = $(el).attr("src");
    const dataSrc = $(el).attr("data-src") || $(el).attr("data-lazy-src");
    const srcset = $(el).attr("srcset");

    if (dataSrc) images.add(dataSrc);
    if (src && !src.startsWith("data:")) images.add(src);
    if (srcset) {
      const first = srcset.split(",")[0]?.trim().split(/\s+/)[0];
      if (first) images.add(first);
    }
  });

  // Fallback: extract image URLs from raw HTML/JS (catches SPAs with inline data)
  const urlRegex = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:[^\s"'<>]*)/gi;
  let match;
  while ((match = urlRegex.exec(html)) !== null) {
    // Clean up trailing punctuation or encoded artifacts
    let imgUrl = match[0].replace(/[),;]+$/, "");
    // Skip srcset descriptors (e.g. "...png 320w")
    imgUrl = imgUrl.replace(/\s+\d+[wx]$/, "");
    images.add(imgUrl);
  }

  // Resolve relative URLs and deduplicate by base filename
  const resolved: string[] = [];
  const seenBase = new Set<string>();
  for (const img of images) {
    try {
      const abs = new URL(img, pageUrl).href;
      // Deduplicate by base path (ignore resize params for same image)
      const basePath = abs.replace(/[?#].*$/, "").replace(/\/cdn-cgi\/image\/[^/]+\//, "/");
      if (seenBase.has(basePath)) continue;
      seenBase.add(basePath);
      resolved.push(abs);
    } catch {
      // skip invalid URLs
    }
  }

  // Filter out tiny icons/tracking pixels by URL heuristics
  return resolved.filter((url) => {
    const lower = url.toLowerCase();
    return (
      !lower.includes("favicon") &&
      !lower.includes("logo") &&
      !lower.includes("icon") &&
      !lower.includes("sprite") &&
      !lower.includes("pixel") &&
      !lower.includes("tracking") &&
      !lower.includes("badge") &&
      !lower.includes("1x1") &&
      !lower.endsWith(".svg") &&
      !lower.endsWith(".gif")
    );
  });
}

function extractPriceFromHtml(html: string): number | null {
  const prices: number[] = [];
  let m;

  // Only match "amount"/"price" keys when near other price-related context
  // Look for JSON blocks that contain both a price key AND a currency indicator nearby
  const priceBlockRegex = /"(?:amount|price|salePrice|sale_price|currentPrice)"\s*:\s*([0-9]+(?:\.[0-9]+)?)/g;
  while ((m = priceBlockRegex.exec(html)) !== null) {
    const val = parseFloat(m[1]);
    // Check nearby context (200 chars around) for currency indicators
    const start = Math.max(0, m.index - 200);
    const end = Math.min(html.length, m.index + 200);
    const context = html.slice(start, end).toLowerCase();
    const hasCurrencyContext =
      context.includes("currency") ||
      context.includes("eur") ||
      context.includes("usd") ||
      context.includes("gbp") ||
      context.includes("€") ||
      context.includes("\\u20ac") ||
      context.includes("formatted");
    if (hasCurrencyContext && val >= 1 && val <= 5000) {
      prices.push(val);
    }
  }

  // Match formatted prices like "29,90 €" or "€29.90" or "29.90€"
  const formattedRegex = /"formatted"\s*:\s*"([0-9]+[,.]?[0-9]*)\s*[€$£]"/g;
  while ((m = formattedRegex.exec(html)) !== null) {
    const val = parseFloat(m[1].replace(",", "."));
    if (val >= 1 && val <= 5000) prices.push(val);
  }

  if (prices.length === 0) return null;

  // Return the most common price (likely the product price, not shipping etc.)
  const freq = new Map<number, number>();
  for (const p of prices) {
    freq.set(p, (freq.get(p) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function isAntiBot(html: string): boolean {
  return (
    html.includes("bm-verify") ||
    html.includes("_sec/verify") ||
    html.includes("challenge-platform") ||
    (html.includes("http-equiv=\"refresh\"") && html.length < 5000)
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const html = await fetchHTML(url);

    if (isAntiBot(html)) {
      return NextResponse.json(
        { error: "This site blocks automated requests. Please fill in the details manually." },
        { status: 422 }
      );
    }

    const $ = cheerio.load(html);

    // Try JSON-LD first (more structured), then fall back to Open Graph
    const jsonLd = extractJsonLd($);
    const og = extractOpenGraph($);
    const pageImages = extractAllImages($, url, html);

    // Merge all image sources, JSON-LD images first, then page images, deduplicated
    const jsonLdImages = (jsonLd?.images as string[] | undefined) || [];
    const allImages = [...new Set([...jsonLdImages, ...pageImages])];

    const bestImage = jsonLd?.imageUrl || og.imageUrl || allImages[0] || "";

    const result = {
      title: (jsonLd?.title || og.title || "") as string,
      description: (jsonLd?.description || og.description || "") as string,
      imageUrl: bestImage as string,
      images: allImages,
      price: jsonLd?.price ?? og.price ?? extractPriceFromHtml(html),
    };

    if (!result.title) {
      return NextResponse.json(
        { error: "Could not extract product info. Please fill in the details manually." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch URL. Please fill in the details manually." },
      { status: 400 }
    );
  }
}
