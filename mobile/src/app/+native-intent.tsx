// expo-share-intent opens the app with `envly://dataUrl=…`; that is not a screen,
// so land on the home screen and let <ShareHandler /> pick the shared content up.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('dataUrl=')) return '/';
  return path;
}
