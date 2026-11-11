// Affiliate configuration
// Add your affiliate IDs here after signing up with each program.

const AMAZON_TAG = process.env.AMAZON_AFFILIATE_TAG || ""; // e.g. "envly-21"
const AWIN_PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID || ""; // e.g. "123456"

// Awin advertiser IDs per merchant
// Find these in your Awin dashboard after being accepted by each merchant
const AWIN_MERCHANTS: Record<string, string> = {
  // "fnac.com": "12345",
  // "cdiscount.com": "12346",
  // "darty.com": "12347",
  // "zalando.fr": "12348",
  // "nike.com": "12349",
  // "lego.com": "12350",
};

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export function buildAffiliateUrl(originalUrl: string): string {
  const domain = getDomain(originalUrl);

  // Amazon
  if (AMAZON_TAG && domain.includes("amazon.")) {
    const u = new URL(originalUrl);
    u.searchParams.set("tag", AMAZON_TAG);
    return u.toString();
  }

  // Awin merchants
  if (AWIN_PUBLISHER_ID) {
    const merchantId = Object.entries(AWIN_MERCHANTS).find(([d]) =>
      domain.includes(d)
    )?.[1];

    if (merchantId) {
      return `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${encodeURIComponent(originalUrl)}`;
    }
  }

  // No affiliate program — return original URL
  return originalUrl;
}

export function isAffiliateSupported(url: string): boolean {
  const domain = getDomain(url);

  if (AMAZON_TAG && domain.includes("amazon.")) return true;

  if (AWIN_PUBLISHER_ID) {
    return Object.keys(AWIN_MERCHANTS).some((d) => domain.includes(d));
  }

  return false;
}
