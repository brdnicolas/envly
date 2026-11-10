import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Avatar } from '@/components/primitives';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';

const ICONS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  '(lists)': { label: 'Accueil', icon: { ios: 'house', android: 'home' }, iconActive: { ios: 'house.fill', android: 'home' } },
  friends: { label: 'Amis', icon: { ios: 'person.2', android: 'group' }, iconActive: { ios: 'person.2.fill', android: 'group' } },
};

/** Compact, icon-only bar: Home · Friends · Account. */
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const go = (index: number) => {
    const route = state.routes[index];
    const focused = state.index === index;
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) {
      haptic.select();
      navigateToTab(route.key);
    }
  };

  const item = (name: string) => {
    const index = state.routes.findIndex((r: { name: string }) => r.name === name);
    const focused = state.index === index;
    if (name === 'profile') {
      return (
        <Pressable key={name} onPress={() => go(index)} style={styles.item} accessibilityRole="tab" accessibilityLabel="Compte" accessibilityState={{ selected: focused }} hitSlop={4}>
          <View style={[styles.avatarRing, focused && { borderColor: Colors.text }]}>
            <Avatar uri={user?.image} name={user?.name} size={24} />
          </View>
        </Pressable>
      );
    }
    const cfg = ICONS[name];
    return (
      <Pressable key={name} onPress={() => go(index)} style={styles.item} accessibilityRole="tab" accessibilityLabel={cfg.label} accessibilityState={{ selected: focused }} hitSlop={4}>
        <Icon name={focused ? cfg.iconActive : cfg.icon} size={24} color={focused ? Colors.text : Colors.text2} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom - 8, 6) }]}>
      {item('(lists)')}
      {item('friends')}
      {item('profile')}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: 6,
  },
  item: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
});
