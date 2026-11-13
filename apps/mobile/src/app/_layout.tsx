import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, useFonts } from '@expo-google-fonts/geist';
import { StatusBar } from 'expo-status-bar';

import { ToastProvider } from '@/components/toast';
import { Colors, Fonts } from '@/constants/theme';
import { extractUrl } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth';
import { registerForPush, usePushRouting } from '@/lib/push';

SplashScreen.preventAutoHideAsync();

// Dark-only app (matches the website): native controls, keyboard and alerts follow.
Appearance.setColorScheme('dark');

// Deep links (shared product → /add) still get the tabs underneath the modal
/** Routes drawn as our own bottom-attached <Sheet> over the current screen. */
const SHEET = { presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } } as const;

export const unstable_settings = { anchor: 'index' };

export default function RootLayout() {
  return (
    <ShareIntentProvider options={{ resetOnBackground: true }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ShareIntentProvider>
  );
}

function App() {
  const { loading, token } = useAuth();
  const [fontsLoaded] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold });
  const ready = !loading && fontsLoaded;
  const navTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: Colors.bg, card: Colors.bg, text: Colors.text, primary: Colors.text, border: Colors.border },
    fonts: {
      ...DarkTheme.fonts,
      regular: { fontFamily: Fonts.regular, fontWeight: '400' as const },
      medium: { fontFamily: Fonts.medium, fontWeight: '500' as const },
      bold: { fontFamily: Fonts.semibold, fontWeight: '600' as const },
      heavy: { fontFamily: Fonts.bold, fontWeight: '700' as const },
    },
  };

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <ToastProvider>
        <ShareHandler />
        <PushHandler />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg },
            statusBarStyle: 'light',
            fullScreenGestureEnabled: true,
          }}>
          <Stack.Protected guard={!!token}>
            <Stack.Screen name="index" />
            <Stack.Screen name="collection/[id]" />
            <Stack.Screen name="friends" />
            <Stack.Screen name="user/[id]" />
            <Stack.Screen name="friends-search" options={SHEET} />
            <Stack.Screen name="blocked" options={SHEET} />
            <Stack.Screen name="santa/[id]" />
            <Stack.Screen name="s/[code]" />

            <Stack.Screen name="santa/new" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="santa/import" options={SHEET} />
            <Stack.Screen
              name="santa/invite"
              options={SHEET}
            />
            <Stack.Screen name="profile" />
            <Stack.Screen name="wish/[id]" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen
              name="new-collection"
              options={SHEET}
            />
          </Stack.Protected>
          <Stack.Protected guard={!token}>
            <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
          </Stack.Protected>
        </Stack>
      </ToastProvider>
    </ThemeProvider>
  );
}

/**
 * Notification taps open their screen. As soon as the user is signed in, ask for notification permission
 * (iOS shows its prompt only once; afterwards this just refreshes the device token).
 */
function PushHandler() {
  const { token } = useAuth();
  usePushRouting(!!token);
  useEffect(() => {
    if (token) void registerForPush({ ask: true });
  }, [token]);
  return null;
}

/** "Partager → Envly" from Safari, Amazon, etc. opens the add screen with the shared link. */
function ShareHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const { token } = useAuth();

  useEffect(() => {
    // Keep the share pending until the user is signed in.
    if (!hasShareIntent || !token) return;
    const url = shareIntent.webUrl ?? extractUrl(shareIntent.text);
    // Product data extracted in the shared page itself (share-extension/preprocess.js)
    const meta = (shareIntent.meta ?? {}) as Record<string, string | undefined>;
    resetShareIntent();
    if (url)
      router.push({
        pathname: '/add',
        params: {
          url,
          ...(meta['envly:title'] && { title: meta['envly:title'] }),
          ...(meta['envly:price'] && { price: meta['envly:price'] }),
          ...(meta['envly:images'] && { images: meta['envly:images'] }),
        },
      });
  }, [hasShareIntent, shareIntent, token, resetShareIntent]);

  return null;
}
