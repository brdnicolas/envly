(() => {
  const ENVLY_URL = "https://envly.vercel.app";
  const PRICE_REGEX =
    /(?:\d[\d\s.,]*\d\s*[€$£]|[€$£]\s*\d[\d\s.,]*\d|\d[\d\s.,]*\d\s*(?:EUR|USD|GBP))/i;

  // Only show on pages that contain a price
  if (!PRICE_REGEX.test(document.body.innerText)) return;

  function scrapeImages() {
    const images = new Set();

    // OG image
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (ogImage) images.add(ogImage);

    // JSON-LD product images
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        const data = JSON.parse(el.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
            const raw = Array.isArray(item.image) ? item.image : item.image ? [item.image] : [];
            raw.forEach((img) => {
              const url = typeof img === "string" ? img : img?.url;
              if (url) images.add(url);
            });
          }
        }
      } catch {}
    });

    // Product images from img tags (filter out tiny icons)
    document.querySelectorAll("img").forEach((img) => {
      const src = img.dataset.src || img.dataset.lazySrc || img.src;
      if (!src || src.startsWith("data:")) return;
      const lower = src.toLowerCase();
      if (
        lower.includes("favicon") || lower.includes("logo") || lower.includes("icon") ||
        lower.includes("sprite") || lower.includes("pixel") || lower.includes("tracking") ||
        lower.includes("badge") || lower.endsWith(".svg") || lower.endsWith(".gif")
      ) return;
      // Skip tiny images
      if (img.naturalWidth > 0 && img.naturalWidth < 50) return;
      if (img.naturalHeight > 0 && img.naturalHeight < 50) return;
      images.add(src);
    });

    return [...images].slice(0, 20);
  }

  function scrapePrice() {
    // Meta tags
    const priceMeta =
      document.querySelector('meta[property="product:price:amount"]')?.getAttribute("content") ||
      document.querySelector('meta[property="og:price:amount"]')?.getAttribute("content");
    if (priceMeta) return priceMeta;

    // JSON-LD
    for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(el.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
            const price = item.offers?.price ?? item.offers?.[0]?.price;
            if (price) return String(price);
          }
        }
      } catch {}
    }

    // DOM fallback: look for price in visible elements
    const priceRegex = /(\d[\d\s]*[.,]\d{2})\s*[€$£]/;
    const selectors = [
      '[class*="price" i]:not([class*="old" i]):not([class*="crossed" i]):not([class*="was" i])',
      '[data-price]',
      '[itemprop="price"]',
    ];
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        // Check data-price attribute first
        const dataPrice = el.getAttribute("data-price") || el.getAttribute("content");
        if (dataPrice) {
          const val = parseFloat(dataPrice.replace(",", "."));
          if (val >= 0.5 && val <= 50000) return String(val);
        }
        // Then text content
        const match = el.textContent.match(priceRegex);
        if (match) {
          const val = parseFloat(match[1].replace(/\s/g, "").replace(",", "."));
          if (val >= 0.5 && val <= 50000) return String(val);
        }
      }
    }

    return "";
  }

  function scrapeTitle() {
    // OG title
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    if (ogTitle) return ogTitle.trim();

    // JSON-LD
    for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(el.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
            if (item.name) return item.name.trim();
          }
        }
      } catch {}
    }

    return document.title;
  }

  const btn = document.createElement("button");
  btn.id = "envly-fab";
  btn.title = "Add to Envly";
  btn.setAttribute("aria-label", "Add to Envly");

  const ICON_PLUS = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const ICON_CHECK = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  btn.innerHTML = ICON_PLUS;

  // Check if this URL is already in the wishlist (via background for cookie access)
  chrome.runtime.sendMessage(
    { type: "CHECK_URL", url: window.location.href },
    (data) => {
      if (data?.exists) {
        btn.classList.add("envly-fab--done");
        btn.innerHTML = ICON_CHECK;
        btn.title = "Déjà dans Envly";
      }
    }
  );

  btn.addEventListener("click", () => {
    if (btn.classList.contains("envly-fab--done")) return;

    const pageUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(scrapeTitle());
    const price = encodeURIComponent(scrapePrice());
    const images = encodeURIComponent(JSON.stringify(scrapeImages()));

    window.open(
      `${ENVLY_URL}/add?url=${pageUrl}&title=${title}&price=${price}&images=${images}&from=extension`,
      "_blank"
    );
    btn.classList.add("envly-fab--done");
    btn.innerHTML = ICON_CHECK;
  });

  document.body.appendChild(btn);
})();
