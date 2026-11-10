import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { PAGE_EXTRACTOR_JS } from '@/lib/page-extractor.generated';

export type PageData = { title: string | null; price: number | null; images: string[]; url: string };

const TIMEOUT_MS = 15000;

// Runs the shared extractor inside the page, retrying while client-side content loads.
const INJECTED = `
(function () {
  if (window.__envlyReader) return;
  window.__envlyReader = true;
  var tries = 0;
  function collect() {
    var metas = { title: document.title };
    document.querySelectorAll('meta').forEach(function (m) {
      var n = m.getAttribute('name') || m.getAttribute('property');
      var c = m.getAttribute('content');
      if (n && c) metas[n] = c;
    });
    ${PAGE_EXTRACTOR_JS}
    return metas;
  }
  function attempt() {
    tries++;
    var m = {};
    try { m = collect(); } catch (e) {}
    var done = (m['envly:title'] && m['envly:price']) || tries >= 5;
    if (!done) return setTimeout(attempt, 1200);
    window.ReactNativeWebView.postMessage(JSON.stringify({
      title: m['envly:title'] || null,
      price: m['envly:price'] || null,
      images: m['envly:images'] || null,
      url: location.href,
      captcha: /validateCaptcha|captcha/i.test(document.documentElement.innerHTML.slice(0, 20000)) && !m['envly:price']
    }));
  }
  if (document.readyState === 'complete') attempt();
  else window.addEventListener('load', attempt);
})();
true;
`;

/** Generic store-name titles mean we got an interstitial, not a product. */
function isGenericTitle(t: string | null) {
  return !t || t.length < 4 || /^(amazon|www\.)?[a-z0-9-]+\.(fr|com|de|co\.uk|it|es)$/i.test(t.trim());
}

/**
 * Reads a product page on the device itself, in a hidden WebView — like the
 * browser extension does. The request comes from the user's phone, as if they
 * opened the page, so it works on sites that block our server (Amazon…).
 */
export function usePageReader() {
  const [job, setJob] = useState<{ id: number; url: string } | null>(null);
  const pending = useRef<{ id: number; resolve: (d: PageData | null) => void; timer: ReturnType<typeof setTimeout> } | null>(null);

  function finish(id: number, data: PageData | null) {
    const p = pending.current;
    if (!p || p.id !== id) return;
    clearTimeout(p.timer);
    pending.current = null;
    setJob(null);
    p.resolve(data);
  }

  function read(url: string): Promise<PageData | null> {
    if (pending.current) finish(pending.current.id, null);
    const id = Date.now();
    return new Promise((resolve) => {
      const timer = setTimeout(() => finish(id, null), TIMEOUT_MS);
      pending.current = { id, resolve, timer };
      setJob({ id, url });
    });
  }

  function onMessage(id: number, e: WebViewMessageEvent) {
    try {
      const raw = JSON.parse(e.nativeEvent.data) as { title: string | null; price: string | null; images: string | null; url: string; captcha?: boolean };
      if (raw.captcha || isGenericTitle(raw.title)) return finish(id, null);
      let images: string[] = [];
      try {
        const parsed = raw.images ? JSON.parse(raw.images) : [];
        if (Array.isArray(parsed)) images = parsed.filter((u): u is string => typeof u === 'string');
      } catch {}
      const price = raw.price != null ? Number(raw.price) : NaN;
      finish(id, { title: raw.title, price: Number.isFinite(price) ? price : null, images, url: raw.url });
    } catch {
      finish(id, null);
    }
  }

  const element = job ? (
    <View pointerEvents="none" style={styles.hidden} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <WebView
        key={job.id}
        source={{ uri: job.url }}
        injectedJavaScript={INJECTED}
        onMessage={(e) => onMessage(job.id, e)}
        onError={() => finish(job.id, null)}
        onHttpError={(e) => e.nativeEvent.statusCode >= 500 && finish(job.id, null)}
        javaScriptEnabled
        sharedCookiesEnabled
        mediaPlaybackRequiresUserAction
        allowsInlineMediaPlayback={false}
        style={styles.webview}
      />
    </View>
  ) : null;

  return { read, element };
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', left: -2000, top: 0, width: 390, height: 844, opacity: 0 },
  webview: { width: 390, height: 844 },
});
