import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { Txt } from '@/components/primitives';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

const HEIGHT = 48;
const GLASS = isLiquidGlassAvailable();

/** Height to leave under scrolling content so the last item clears the pill. */
export const BOTTOM_ACTION_SPACE = HEIGHT + 16;

/** Hide the pill while scrolling down (reading), bring it back on any scroll up. */
export function useScrollReveal() {
  const [visible, setVisible] = useState(true);
  const last = useRef(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - last.current;
    if (Math.abs(dy) < 6) return;
    last.current = y;
    const next = dy < 0 || y < 40;
    if (next !== visible) setVisible(next);
  };
  return { visible, onScroll };
}

/** Small floating glass capsule: "+ Ajouter". Content scrolls underneath. */
export function BottomAction({ title, onPress, visible = true }: { title: string; onPress: () => void; visible?: boolean }) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom - 6, 12);

  const animated = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 180 }),
    transform: [{ translateY: withTiming(visible ? 0 : HEIGHT + bottom, { duration: 220 }) }],
  }));

  const content = (
    <View style={styles.content}>
      <Icon name={Icons.plus} size={17} weight="semibold" />
      <Txt style={styles.label}>{title}</Txt>
    </View>
  );

  return (
    <Animated.View pointerEvents={visible ? 'box-none' : 'none'} style={[styles.wrap, { bottom }, animated]}>
      <Pressable
        onPress={() => {
          haptic.select();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [styles.shadow, pressed && !GLASS && { opacity: 0.8 }]}>
        {GLASS ? (
          <GlassView glassEffectStyle="regular" isInteractive colorScheme="dark" style={styles.pill}>
            {content}
          </GlassView>
        ) : (
          <View style={[styles.pill, styles.fallback]}>{content}</View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  shadow: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  pill: { height: HEIGHT, borderRadius: Radius.pill, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 22 },
  fallback: { backgroundColor: Colors.elevated, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.borderStrong },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.text },
});
