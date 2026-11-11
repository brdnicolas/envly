// Runs inside the shared Safari page (iOS share extension preprocessor), i.e. on the
// page the user already loaded: no anti-bot, no server fetch. Adds envly:* keys to `metas`.
// Injected into ShareExtensionPreprocessor.run() by app.config.js.
try {
  var envly = { title: null, price: null, images: [] };
  var addImg = function (u) {
    if (!u || typeof u !== 'string' || u.indexOf('data:') === 0) return;
    try { u = new URL(u, document.baseURI).href; } catch (e) { return; }
    if (envly.images.indexOf(u) < 0 && envly.images.length < 12) envly.images.push(u);
  };
  var num = function (v) {
    if (v == null) return null;
    if (typeof v === 'number') return v > 0 ? v : null;
    var s = String(v).replace(/[  \s]/g, '');
    var m = s.match(/\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?/);
    if (!m) return null;
    var t = m[0];
    var dec = t.match(/[.,](\d{1,2})$/);
    var int = (dec ? t.slice(0, -dec[0].length) : t).replace(/[.,]/g, '');
    var n = parseFloat(int + (dec ? '.' + dec[1] : ''));
    return n > 0 && n < 1000000 ? n : null;
  };

  // Amazon
  var at = document.querySelector('#productTitle, #title, #title_feature_div h1, [data-hook="product-title"]');
  if (at) {
    // Mobile pages put name + descriptive subtitle in #title: keep the first text line only.
    var leaf = null;
    var all = at.querySelectorAll('*');
    for (var i = 0; i < all.length && !leaf; i++) {
      if (!all[i].children.length && all[i].textContent.trim().length > 3) leaf = all[i];
    }
    var t = (leaf || at).textContent.trim();
    if (t) envly.title = t;
  }
  var isAd = function (el) {
    return !!el.closest('[data-ad-feedback], [data-ad-details], [id*="sponsored" i], [class*="sponsored" i], [id*="ad-" i], [class*="sp_"], [cel_widget_id*="adplacements" i], [data-component-type="sp-sponsored-result"], .a-carousel-container');
  };
  var core = document.querySelector('#corePrice_feature_div .a-offscreen, #corePrice_mobile_feature_div .a-offscreen, #corePriceDisplay_desktop_feature_div .a-offscreen, #corePriceDisplay_mobile_feature_div .a-offscreen, #apex_desktop .a-offscreen, #apex_offerDisplay_mobile .a-offscreen, .priceToPay .a-offscreen, #price_inside_buybox');
  if (core && !isAd(core)) envly.price = num(core.textContent);
  if (envly.price == null) {
    // First real price after the product title, skipping ads and struck-through prices
    var prices = document.querySelectorAll('.a-price .a-offscreen');
    for (var j = 0; j < prices.length && envly.price == null; j++) {
      var el = prices[j];
      if (isAd(el) || el.closest('.a-text-price')) continue;
      if (at && !(at.compareDocumentPosition(el) & 4)) continue;
      envly.price = num(el.textContent);
    }
  }
  var li = document.querySelector('#landingImage, #imgBlkFront, #main-image');
  if (li) {
    addImg(li.getAttribute('data-old-hires'));
    try {
      var dyn = JSON.parse(li.getAttribute('data-a-dynamic-image') || '{}');
      Object.keys(dyn).sort(function (a, b) { return (dyn[b][0] || 0) - (dyn[a][0] || 0); }).forEach(addImg);
    } catch (e) {}
    addImg(li.getAttribute('src'));
  }

  // JSON-LD Product (incl. @graph / ProductGroup)
  var walk = function (n, d) {
    if (!n || typeof n !== 'object' || d > 8) return;
    if (Array.isArray(n)) { n.forEach(function (x) { walk(x, d + 1); }); return; }
    var t = [].concat(n['@type'] || []).join(' ').toLowerCase();
    if (/product/.test(t)) {
      if (!envly.title && n.name) envly.title = String(n.name);
      [].concat(n.image || []).forEach(function (i) { addImg(typeof i === 'string' ? i : i && (i.url || i.contentUrl)); });
      [].concat(n.offers || []).forEach(function (o) {
        if (envly.price == null && o) envly.price = num(o.price != null ? o.price : o.lowPrice != null ? o.lowPrice : o.priceSpecification && o.priceSpecification.price);
      });
    }
    Object.keys(n).forEach(function (k) { if (n[k] && typeof n[k] === 'object') walk(n[k], d + 1); });
  };
  document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
    try { walk(JSON.parse(s.textContent), 0); } catch (e) {}
  });

  // Meta / microdata fallbacks
  if (!envly.title) envly.title = metas['og:title'] || metas['twitter:title'] || null;
  if (!envly.title) {
    var h1 = document.querySelector('h1');
    if (h1 && h1.textContent.trim().length > 3) envly.title = h1.textContent.trim();
  }
  if (!envly.title && document.title) envly.title = document.title;
  // Drop store suffixes: "Product : Amazon.fr: Bricolage", "Product | Fnac"
  if (envly.title) {
    envly.title = envly.title
      .replace(/\s*[:|–-]\s*Amazon\.[a-z.]+.*$/i, '')
      .replace(/^Amazon\.[a-z.]+\s*:\s*/i, '')
      .replace(/\s*[|–]\s*[^|–]{2,30}$/, function (m) { return /amazon|fnac|darty|zalando|decathlon|ikea|etsy/i.test(m) ? '' : m; });
  }
  if (envly.price == null) {
    var ip = document.querySelector('[itemprop="price"]');
    envly.price = num(metas['product:price:amount'] || metas['og:price:amount'] || (ip && (ip.getAttribute('content') || ip.textContent)));
  }
  addImg(metas['og:image']);
  addImg(metas['twitter:image']);

  if (envly.title) metas['envly:title'] = envly.title.replace(/\s+/g, ' ').trim();
  if (envly.price != null) metas['envly:price'] = String(envly.price);
  if (envly.images.length) metas['envly:images'] = JSON.stringify(envly.images);
} catch (e) {}
