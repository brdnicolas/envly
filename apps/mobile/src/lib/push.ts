import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api';

// Show notifications even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let currentToken: string | null = null;

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/**
 * Register this device for push. With `ask`, shows the system prompt if it was never answered
 * (done right after sign-in, see PushHandler in app/_layout.tsx).
 * Silently does nothing on simulators, without permission, or before `eas init` (no projectId).
 */
export async function registerForPush({ ask }: { ask: boolean }) {
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && ask) ({ status } = await Notifications.requestPermissionsAsync());
    // Simulators can show notifications (e.g. `xcrun simctl push`) but have no push token.
    if (status !== 'granted' || !Device.isDevice) return;

    const id = projectId();
    if (!id) {
      console.warn('[push] No EAS projectId yet (run `eas init`), skipping registration');
      return;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Envly',
        importance: AndroidImportance.DEFAULT,
      });
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    currentToken = token;
    await api('/api/push', { method: 'POST', body: { token, platform: Platform.OS } });
  } catch (e) {
    // No push entitlement (free Apple account), offline, … — the app works without push.
    console.warn('[push] registration failed', e);
  }
}

/** Sign-out: this device stops receiving the previous user's notifications. */
export async function unregisterPush() {
  if (!currentToken) return;
  try {
    await api('/api/push', { method: 'DELETE', body: { token: currentToken } });
  } catch {}
  currentToken = null;
}

/** Tapping a notification opens its `url` (cold start included). */
export function usePushRouting(enabled: boolean) {
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!enabled || !last) return;
    const url = last.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) {
      router.push(url as Href);
      Notifications.clearLastNotificationResponse();
    }
  }, [enabled, last]);
}

/** Current notification permission, without prompting. */
export async function pushStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'undetermined';
  }
}
