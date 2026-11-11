import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icons } from '@/components/icon';
import { IconButton, Txt } from '@/components/primitives';
import { Space } from '@/constants/theme';

/** Back chevron · title · optional right-side actions. */
export function NavBar({ title, right }: { title?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <IconButton icon={Icons.chevronLeft} label="Retour" onPress={() => router.back()} />
      <Txt variant="headline" numberOfLines={1} style={styles.title}>
        {title ?? ''}
      </Txt>
      {right ?? <View style={{ width: 36 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.xs, paddingBottom: Space.xs, gap: Space.xs },
  title: { flex: 1, fontSize: 18, lineHeight: 24 },
});
