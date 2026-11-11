import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon, Icons } from '@/components/icon';
import { Button, Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { pushStatus, registerForPush } from '@/lib/push';

const KEY = 'envly.notifyCard.dismissedAt';
const SNOOZE = 14 * 24 * 3600 * 1000; // "Plus tard" hides it for two weeks

/**
 * Soft prompt on the home screen. Friends can only invite you to a Secret Santa (and you only
 * learn the draw result) if notifications are on *before* it happens, so we ask early, with
 * context. iOS shows its system prompt only once: we never trigger it without a tap here.
 */
export function NotifyCard() {
  const [state, setState] = useState<'hidden' | 'ask' | 'settings'>('hidden');

  useEffect(() => {
    void (async () => {
      const status = await pushStatus();
      if (status === 'granted') return;
      const dismissed = Number((await SecureStore.getItemAsync(KEY)) ?? 0);
      if (Date.now() - dismissed < SNOOZE) return;
      setState(status === 'denied' ? 'settings' : 'ask');
    })();
  }, []);

  if (state === 'hidden') return null;

  async function enable() {
    haptic.select();
    if (state === 'settings') return void Linking.openSettings();
    await registerForPush({ ask: true });
    if ((await pushStatus()) === 'granted') haptic.success();
    setState('hidden');
  }

  async function later() {
    await SecureStore.setItemAsync(KEY, String(Date.now()));
    setState('hidden');
  }

  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={styles.card}>
      <View style={styles.icon}>
        <Icon name={Icons.bell} size={18} color="#E8C872" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyMedium">Ne ratez pas une invitation</Txt>
        <Txt variant="footnote" color="text2">
          Soyez prévenu quand un ami vous invite à un Secret Santa ou réserve dans vos listes.
        </Txt>
        <View style={styles.actions}>
          <Button title={state === 'settings' ? 'Ouvrir les réglages' : 'Activer'} size="sm" onPress={() => void enable()} />
          <Pressable onPress={() => void later()} hitSlop={8}>
            <Txt variant="footnote" color="text3">
              Plus tard
            </Txt>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Space.md,
    marginHorizontal: Space.lg,
    marginTop: Space.xl,
    padding: Space.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,200,114,0.12)' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Space.lg, marginTop: Space.md },
});
