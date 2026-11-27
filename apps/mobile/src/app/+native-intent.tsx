// Incoming links: share-extension payloads and Universal / App Links from envly.fr.
//  - expo-share-intent opens the app with `envly://dataUrl=…`: not a screen, land on home
//    and let <ShareHandler /> pick the shared content up.
//  - https://www.envly.fr/w/<slug> (public list) → /collection/<slug> (the API accepts a slug)
//  - https://www.envly.fr/u/<slug> (profile)     → /user/<slug>
//  - /s/<code> and /collection/<id> exist in the app as-is.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('dataUrl=')) return '/';
  let pathname = path;
  try {
    pathname = new URL(path, 'https://www.envly.fr').pathname;
  } catch {
    return path;
  }
  const m = pathname.match(/^\/(w|u|s|collection)\/([^/?#]+)/);
  if (!m) return path;
  const [, kind, value] = m;
  if (kind === 'w') return `/collection/${value}`;
  if (kind === 'u') return `/user/${value}`;
  return `/${kind}/${value}`;
}
