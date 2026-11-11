(() => {
  if (window.__envlyLoaded) return;
  window.__envlyLoaded = true;

  // All schema.org Product nodes in JSON-LD, including ones nested in @graph / ProductGroup
  function ldProducts() {
    const out = [];
    const walk = (node, depth) => {
      if (!node || typeof node !== "object" || depth > 10) return;
      if (Array.isArray(node)) return node.forEach((n) => walk(n, depth + 1));
      const types = [].concat(node["@type"] || []).map((t) => String(t).toLowerCase());
      if (types.some((t) => /(^|[/:])(product|productgroup|individualproduct)$/.test(t))) out.push(node);
      Object.values(node).forEach((v) => walk(v, depth + 1));
    };
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        walk(JSON.parse(el.textContent), 0);
      } catch {}
    });
    return out;
  }

  function scrapeImages() {
    const images = new Set();

    // OG image
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (ogImage) images.add(ogImage);

    // JSON-LD product images
    for (const item of ldProducts()) {
      const raw = Array.isArray(item.image) ? item.image : item.image ? [item.image] : [];
      raw.forEach((img) => {
        const url = typeof img === "string" ? img : img?.url || img?.contentUrl;
        if (url) images.add(url);
      });
    }

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
    for (const item of ldProducts()) {
      for (const offer of [].concat(item.offers || [])) {
        const price = offer?.price ?? offer?.lowPrice ?? offer?.priceSpecification?.price;
        if (price) return String(price);
      }
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
    const named = ldProducts().find((item) => typeof item.name === "string" && item.name.trim());
    if (named) return named.name.trim();

    return document.title;
  }
  /* ───────────────────────── page detection ───────────────────────── */

  function isProductPage() {
    // Amazon (and its clones) expose no schema.org Product: rely on its product-page DOM.
    if (document.querySelector("#productTitle, #dp-container, #add-to-cart-button, #buy-now-button")) return true;
    if (ldProducts().length) return true;
    if (document.querySelector('[itemtype*="schema.org/Product" i]')) return true;
    if (document.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"], [itemprop="price"]')) return true;
    const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute("content") || "";
    return /product/i.test(ogType);
  }

  function amazon() {
    const title = document.querySelector("#productTitle")?.textContent?.trim();
    if (!title) return null;
    const whole = document.querySelector("#corePrice_feature_div .a-price-whole, #corePriceDisplay_desktop_feature_div .a-price-whole, .a-price .a-price-whole")?.textContent || "";
    const frac = document.querySelector("#corePrice_feature_div .a-price-fraction, #corePriceDisplay_desktop_feature_div .a-price-fraction, .a-price .a-price-fraction")?.textContent || "";
    const price = parseFloat(`${whole.replace(/[^\d]/g, "")}.${frac.replace(/[^\d]/g, "") || "0"}`);
    const main = document.querySelector("#landingImage, #imgBlkFront, #main-image");
    let hires = main?.getAttribute("data-old-hires") || "";
    if (!hires) {
      try {
        const dyn = JSON.parse(main?.getAttribute("data-a-dynamic-image") || "{}");
        hires = Object.keys(dyn).sort((a, b) => dyn[b][0] - dyn[a][0])[0] || "";
      } catch {}
    }
    const thumbs = [...document.querySelectorAll("#altImages img")]
      .map((i) => i.src.replace(/\._[^.]*_\./, "."))
      .filter((u) => /^https:/.test(u) && !/play-button|sprite|grey-pixel/i.test(u));
    const images = [...new Set([hires || main?.src, ...thumbs].filter(Boolean))].slice(0, 12);
    return { title, price: Number.isFinite(price) && whole ? price : null, images };
  }

  function scrape() {
    const az = amazon();
    if (az) return az;
    const title = scrapeTitle();
    const priceRaw = scrapePrice();
    const price = priceRaw ? parseFloat(String(priceRaw).replace(/\s/g, "").replace(",", ".")) : NaN;
    const images = scrapeImages().filter((u) => /^https?:/.test(u));
    return { title, price: Number.isFinite(price) ? price : null, images };
  }

  const send = (msg) =>
    new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (res) => resolve(res || { ok: false, status: 0, data: {} }));
      } catch {
        resolve({ ok: false, status: 0, data: {} });
      }
    });

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ───────────────────────── UI (Shadow DOM) ───────────────────────── */

  let starN = 0;
  // Each star gets its own gradient id: a shared id breaks when the first copy is display:none.
  const star = (cls = "") => {
    const id = `ev-g${++starN}`;
    return `<svg ${cls ? `class="${cls}" ` : ""}viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#9a9aa2"/><stop offset="1" stop-color="#e9e9ee"/></linearGradient></defs><path fill="url(#${id})" d="M12 1.5C12.7 8.6 15.4 11.3 22.5 12C15.4 12.7 12.7 15.4 12 22.5C11.3 15.4 8.6 12.7 1.5 12C8.6 11.3 11.3 8.6 12 1.5Z"/></svg>`;
  };
  const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  const CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const CHEV = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif; }
    .pill {
      position: fixed; right: 20px; bottom: 20px; z-index: 2147483646;
      display: flex; align-items: center; gap: 0; height: 38px; padding: 0 11px;
      border-radius: 999px; border: 1px solid rgba(255,255,255,.12);
      background: rgba(12,12,14,.88); color: #fff; cursor: pointer;
      backdrop-filter: blur(16px) saturate(160%); -webkit-backdrop-filter: blur(16px) saturate(160%);
      box-shadow: 0 12px 40px -8px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08);
      transform: translateY(80px); opacity: 0;
      transition: transform .5s cubic-bezier(.16,1,.3,1), opacity .4s, gap .3s, padding .3s, background .2s;
    }
    .pill.in { transform: none; opacity: 1; }
    .pill svg { width: 16px; height: 16px; flex: none; }
    .pill .label { max-width: 0; overflow: hidden; white-space: nowrap; font-size: 13px; font-weight: 600; letter-spacing: -.1px; transition: max-width .35s cubic-bezier(.16,1,.3,1); }
    .pill:hover, .pill:focus-visible { gap: 7px; padding: 0 15px 0 12px; background: rgba(20,20,23,.95); }
    .pill:hover .label, .pill:focus-visible .label { max-width: 180px; }
    .pill.done { background: rgba(20,20,23,.95); }
    .pill.done .tick { display: flex; }
    .pill .tick { display: none; position: absolute; top: -3px; right: -3px; width: 18px; height: 18px; border-radius: 50%; background: #E8C872; color: #111; align-items: center; justify-content: center; border: 2px solid #0c0c0e; }
    .pill .tick svg { width: 10px; height: 10px; }
    .pill.hidden { display: none; }

    .scrim { position: fixed; inset: 0; z-index: 2147483646; background: rgba(0,0,0,.25); opacity: 0; pointer-events: none; transition: opacity .3s; }
    .scrim.open { opacity: 1; pointer-events: auto; }
    .panel {
      position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; width: 340px; max-width: calc(100vw - 32px); max-height: calc(100vh - 32px);
      display: flex; flex-direction: column; overflow: hidden;
      border-radius: 28px; border: 1px solid rgba(255,255,255,.1);
      background: #0c0c0e; color: #f4f4f5;
      box-shadow: 0 40px 120px -20px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.06);
      transform: translateY(24px) scale(.97); opacity: 0; visibility: hidden; transform-origin: bottom right;
      transition: transform .4s cubic-bezier(.16,1,.3,1), opacity .25s, visibility 0s linear .4s;
    }
    /* Hidden once slid out, so its shadow never shows on the page edge. */
    .panel.open { transform: none; opacity: 1; visibility: visible; transition: transform .4s cubic-bezier(.16,1,.3,1), opacity .25s, visibility 0s; }
    .head { display: flex; align-items: center; gap: 9px; padding: 18px 18px 6px 20px; }
    .head svg.logo { width: 20px; height: 20px; }
    .head b { font-size: 15px; font-weight: 650; letter-spacing: -.2px; flex: 1; }
    .icon-btn { width: 32px; height: 32px; border-radius: 50%; border: 0; background: rgba(255,255,255,.07); color: #d4d4d8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
    .icon-btn:hover { background: rgba(255,255,255,.14); }
    .icon-btn svg { width: 15px; height: 15px; }
    .body { flex: 0 1 auto; min-height: 0; overflow-y: auto; padding: 8px 18px 14px; display: flex; flex-direction: column; gap: 16px; }
    .media { position: relative; height: min(240px, 34vh); border-radius: 20px; overflow: hidden; background: #fff; flex: none; }
    .media img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .media .empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #a1a1aa; font-size: 13px; background: #18181b; }
    .nav { position: absolute; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border-radius: 50%; border: 0; cursor: pointer; background: rgba(12,12,14,.7); color: #fff; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); opacity: 0; transition: opacity .2s; }
    .media:hover .nav { opacity: 1; }
    .nav svg { width: 16px; height: 16px; }
    .nav.prev { left: 10px; } .nav.next { right: 10px; }
    .count { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); padding: 3px 9px; border-radius: 999px; background: rgba(12,12,14,.7); color: #fff; font-size: 11px; font-weight: 600; backdrop-filter: blur(8px); }
    label { display: block; font-size: 12px; color: #a1a1aa; margin-bottom: 6px; font-weight: 500; }
    textarea, input, select {
      width: 100%; border-radius: 14px; border: 1px solid rgba(255,255,255,.1); background: #151518; color: #fafafa;
      font-size: 14px; padding: 11px 13px; outline: none; transition: border-color .15s, background .15s; resize: none;
    }
    textarea:focus, input:focus, select:focus { border-color: rgba(255,255,255,.35); background: #18181b; }
    textarea { min-height: 0; height: 62px; line-height: 1.4; }
    .row { display: grid; grid-template-columns: 1fr 1.6fr; gap: 10px; }
    .price { position: relative; }
    .price span { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); color: #71717a; font-size: 14px; pointer-events: none; }
    select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M7 10l5 5 5-5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; padding-right: 32px; text-overflow: ellipsis; }
    .foot { padding: 4px 18px 18px; }
    .cta { width: 100%; height: 50px; border-radius: 16px; border: 0; cursor: pointer; background: #f4f4f5; color: #0c0c0e; font-size: 15px; font-weight: 650; letter-spacing: -.1px; transition: transform .1s, opacity .15s, background .15s; }
    .cta:hover { background: #fff; } .cta:active { transform: scale(.98); }
    .cta:disabled { opacity: .5; cursor: default; }
    .ghost { width: 100%; height: 44px; margin-top: 8px; border-radius: 14px; border: 1px solid rgba(255,255,255,.1); background: transparent; color: #d4d4d8; font-size: 14px; font-weight: 550; cursor: pointer; }
    .ghost:hover { background: rgba(255,255,255,.05); }
    .error { color: #f87171; font-size: 12.5px; margin: 0 0 10px; }
    .center { display: flex; min-height: 260px; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 10px; padding: 20px; }
    .center h3 { margin: 6px 0 0; font-size: 20px; font-weight: 650; letter-spacing: -.3px; }
    .center p { margin: 0; color: #a1a1aa; font-size: 14px; line-height: 1.5; max-width: 260px; }
    .badge { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(232,200,114,.12); color: #E8C872; animation: pop .55s cubic-bezier(.34,1.56,.64,1); }
    .badge svg { width: 30px; height: 30px; }
    @keyframes pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .skel { border-radius: 14px; height: 44px; background: linear-gradient(90deg,#151518,#1f1f23,#151518); background-size: 200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { to { background-position: -200% 0; } }
  `;

  const host = document.createElement("div");
  host.id = "envly-root";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `<style>${CSS}</style>
    <button class="pill hidden" part="pill" aria-label="Ajouter à Envly">${star()}<span class="label">Ajouter à Envly</span><span class="tick">${CHECK}</span></button>
    <div class="scrim"></div>
    <aside class="panel" role="dialog" aria-label="Ajouter à Envly" aria-hidden="true">
      <div class="head">${star("logo")}<b>Envly</b><button class="icon-btn close" aria-label="Fermer">${CLOSE}</button></div>
      <div class="content" style="display:flex;flex-direction:column;min-height:0"></div>
    </aside>`;
  const $ = (sel) => root.querySelector(sel);
  const pill = $(".pill"), panel = $(".panel"), scrim = $(".scrim"), content = $(".content");

  const state = { data: null, imageIndex: 0, collections: null, done: false };

  let setDone = function () {
    state.done = true;
    pill.classList.add("done");
    pill.querySelector(".label").textContent = "Dans votre Envly";
    pill.setAttribute("aria-label", "Déjà dans Envly");
  };

  function open() {
    if (!state.data) state.data = scrape();
    panel.classList.add("open");
    scrim.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    renderForm();
    loadCollections();
  }
  function close() {
    panel.classList.remove("open");
    scrim.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  function renderLoading() {
    content.innerHTML = `<div class="body"><div class="media"><div class="empty"></div></div><div class="skel"></div><div class="skel"></div></div>`;
  }

  function renderForm(error) {
    const d = state.data;
    const img = d.images[state.imageIndex];
    const multi = d.images.length > 1;
    const lists = state.collections;
    const lastId = localStorage.getItem("envly:lastCollection");
    content.innerHTML = `
      <div class="body">
        <div class="media">
          ${img ? `<img src="${esc(img)}" alt="" referrerpolicy="no-referrer">` : `<div class="empty">Pas d’image trouvée</div>`}
          ${multi ? `<button class="nav prev" aria-label="Image précédente">${CHEV("M15 5l-7 7 7 7")}</button><button class="nav next" aria-label="Image suivante">${CHEV("M9 5l7 7-7 7")}</button><span class="count">${state.imageIndex + 1} / ${d.images.length}</span>` : ""}
        </div>
        <div><label for="ev-title">Titre</label><textarea id="ev-title" rows="2">${esc(d.title)}</textarea></div>
        <div class="row">
          <div class="price"><label for="ev-price">Prix</label><input id="ev-price" inputmode="decimal" value="${d.price ?? ""}" placeholder="—"><span style="top:calc(50% + 11px)">€</span></div>
          <div><label for="ev-list">Liste</label>${
            lists
              ? `<select id="ev-list">${lists.map((c) => `<option value="${esc(c.id)}" ${c.id === lastId ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>`
              : `<div class="skel"></div>`
          }</div>
        </div>
      </div>
      <div class="foot">
        ${error ? `<p class="error">${esc(error)}</p>` : ""}
        <button class="cta" ${lists && lists.length ? "" : "disabled"}>Ajouter à ma liste</button>
      </div>`;
    const imgEl = content.querySelector(".media img");
    if (imgEl) imgEl.onerror = () => { d.images.splice(state.imageIndex, 1); state.imageIndex = 0; renderForm(); };
    content.querySelector(".prev")?.addEventListener("click", () => { state.imageIndex = (state.imageIndex - 1 + d.images.length) % d.images.length; keepFields(); renderForm(); });
    content.querySelector(".next")?.addEventListener("click", () => { state.imageIndex = (state.imageIndex + 1) % d.images.length; keepFields(); renderForm(); });
    content.querySelector(".cta").addEventListener("click", submit);
  }

  function keepFields() {
    const t = content.querySelector("#ev-title"), p = content.querySelector("#ev-price");
    if (t) state.data.title = t.value;
    if (p) { const v = parseFloat(p.value.replace(",", ".")); state.data.price = Number.isFinite(v) ? v : null; }
  }

  function renderSignedOut() {
    content.innerHTML = `
      <div class="center">
        <div class="badge">${star()}</div>
        <h3>Connectez-vous</h3>
        <p>Connectez-vous à Envly dans ce navigateur pour ajouter des envies en un clic.</p>
      </div>
      <div class="foot"><button class="cta">Se connecter à Envly</button></div>`;
    content.querySelector(".cta").addEventListener("click", () => send({ type: "OPEN", path: "/signin" }));
  }

  function renderSuccess(list, collectionId) {
    content.innerHTML = `
      <div class="center">
        <div class="badge">${CHECK}</div>
        <h3>C’est dans la liste</h3>
        <p>Ajouté à <b style="color:#fafafa">${esc(list)}</b>. Vos proches le verront s’ils ont le lien.</p>
      </div>
      <div class="foot">
        <button class="cta">Voir la liste</button>
        <button class="ghost">Continuer mes achats</button>
      </div>`;
    content.querySelector(".cta").addEventListener("click", () => send({ type: "OPEN", path: `/collection/${collectionId}` }));
    content.querySelector(".ghost").addEventListener("click", close);
  }

  // Fetched once, ahead of time (as soon as a product page loads), shared by every open.
  let collectionsReq = null;
  function fetchCollections() {
    if (!collectionsReq) {
      collectionsReq = (async () => {
        let res = await send({ type: "GET_COLLECTIONS" });
        // A sleeping service worker or a session cookie being refreshed can answer 401/0 once:
        // confirm before telling a signed-in user to sign in.
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 500));
          res = await send({ type: "GET_COLLECTIONS" });
        }
        if (!res.ok) collectionsReq = null; // allow a fresh try next time
        return res;
      })();
    }
    return collectionsReq;
  }

  async function loadCollections() {
    if (state.collections) return;
    const res = await fetchCollections();
    if (state.collections) return;
    if (res.status === 401) return renderSignedOut();
    if (!res.ok) return renderForm("Impossible de joindre Envly. Réessayez dans un instant.");
    state.collections = (Array.isArray(res.data) ? res.data : []).map((c) => ({ id: c.id, name: c.name }));
    keepFields();
    renderForm(state.collections.length ? undefined : "Créez d’abord une liste sur Envly.");
  }

  async function submit() {
    keepFields();
    const select = content.querySelector("#ev-list");
    const btn = content.querySelector(".cta");
    if (!select || !state.data.title.trim()) return;
    btn.disabled = true;
    btn.textContent = "Ajout…";
    const collectionId = select.value;
    const list = select.options[select.selectedIndex]?.textContent || "votre liste";
    const res = await send({
      type: "ADD_WISH",
      wish: {
        title: state.data.title.trim(),
        url: location.href,
        imageUrl: state.data.images[state.imageIndex] || null,
        price: state.data.price,
        collectionId,
      },
    });
    if (res.status === 401) return renderSignedOut();
    if (!res.ok) return renderForm(res.data?.error || "L’ajout a échoué. Réessayez.");
    localStorage.setItem("envly:lastCollection", collectionId);
    setDone();
    renderSuccess(list, collectionId);
  }

  pill.addEventListener("click", open);
  $(".close").addEventListener("click", close);
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("open")) close(); });

  // Toolbar button (popup) → open the panel on any page.
  chrome.runtime.onMessage.addListener((msg, _s, reply) => {
    if (msg.type === "OPEN_PANEL") { open(); reply({ ok: true }); }
  });

  document.documentElement.appendChild(host);

  /* ───────────── Amazon: a native-looking button in the buy box ───────────── */

  let inline = null;
  function mountAmazonButton() {
    // Right under "Acheter cet article" (or "Ajouter au panier" when there's no buy-now).
    const anchor = ["#buyNow_feature_div", "#buy-now-button", "#addToCart_feature_div", "#add-to-cart-button"].map((q) => document.querySelector(q)).find(Boolean);
    if (!anchor || document.getElementById("envly-inline")) return !!inline;
    const slot = anchor.closest("#buyNow_feature_div, #addToCart_feature_div") || anchor.parentElement;
    const wrap = document.createElement("div");
    wrap.id = "envly-inline";
    wrap.style.cssText = "margin:8px 0 2px;";
    const sh = wrap.attachShadow({ mode: "closed" });
    sh.innerHTML = `<style>
      button{all:unset;box-sizing:border-box;width:100%;height:35px;border-radius:100px;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;
        font:500 13px "Amazon Ember",Arial,sans-serif;color:#fff;background:#0c0c0e;border:1px solid #0c0c0e;transition:background .15s, transform .1s}
      button:hover{background:#26262b}button:active{transform:scale(.99)}
      button svg{width:15px;height:15px}
      button.done{background:#fff;color:#0f1111;border-color:#d5d9d9}
      button.done .ck{display:inline}.ck{display:none;color:#b8902f;font-weight:700}
    </style><button type="button" aria-label="Ajouter à Envly">${star()}<span class="lb">Ajouter à ma liste Envly</span><span class="ck">✓</span></button>`;
    const b = sh.querySelector("button");
    b.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); open(); });
    slot.insertAdjacentElement("afterend", wrap);
    inline = { setDone() { b.classList.add("done"); b.querySelector(".lb").textContent = "Dans votre liste Envly"; } };
    return true;
  }

  const baseSetDone = setDone;
  setDone = function () { baseSetDone(); inline?.setDone(); };

  if (isProductPage()) {
    // On Amazon the button lives in the buy box (re-mounted if Amazon redraws it); elsewhere, the floating pill.
    const onAmazon = /(^|\.)amazon\.[a-z.]+$/i.test(location.hostname) && mountAmazonButton();
    if (onAmazon) {
      new MutationObserver(() => { if (!document.getElementById("envly-inline")) { inline = null; mountAmazonButton(); if (state.done) inline?.setDone(); } })
        .observe(document.body, { childList: true, subtree: true });
    } else {
      pill.classList.remove("hidden");
      requestAnimationFrame(() => setTimeout(() => pill.classList.add("in"), 400));
    }
    send({ type: "CHECK_URL", url: location.href }).then((res) => { if (res.data?.exists) setDone(); });
    // Warm up: lists are ready before the user even clicks.
    setTimeout(fetchCollections, 1200);
  }
})();
