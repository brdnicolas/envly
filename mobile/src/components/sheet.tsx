import { router } from 'expo-router';
import { createContext, use, useEffect, useMemo, type ReactNode } from 'react';
import { PanResponder, Pressable, StyleSheet, useWindowDimensions, View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Space } from '@/constants/theme';

const SheetContext = createContext<{ close: (after?: () => void) => void }>({ close: () => router.back() });

/** Close the surrounding sheet with its slide-out animation. */
export const useSheet = () => use(SheetContext);

const OPEN = { duration: 320, easing: Easing.out(Easing.cubic) };
const CLOSE = { duration: 220, easing: Easing.in(Easing.cubic) };

/**
 * Bottom sheet attached to the screen edge (iOS 26 system sheets float above it).
 * Use as the root of a route presented with `presentation: 'transparentModal', animation: 'none'`.
 * The panel paints down to the very bottom; the home-indicator area is inner padding.
 */
export function Sheet({ children, maxHeight = '92%' }: { children: ReactNode; maxHeight?: DimensionValue }) {
  const insets = useSafeAreaInsets();
  const { height: screen } = useWindowDimensions();
  const offset = useSharedValue(screen); // translateY of the panel
  const backdrop = useSharedValue(0);
  const keyboard = useAnimatedKeyboard();
  const closing = useSharedValue(false);

  useEffect(() => {
    offset.set(withTiming(0, OPEN));
    backdrop.set(withTiming(1, OPEN));
  }, [offset, backdrop]);

  const ctx = useMemo(() => {
    const close = (after?: () => void) => {
      if (closing.get()) return;
      closing.set(true);
      const done = () => {
        router.back();
        after?.();
      };
      backdrop.set(withTiming(0, CLOSE));
      offset.set(
        withTiming(screen, CLOSE, (finished) => {
          if (finished) runOnJS(done)();
        })
      );
    };
    return { close };
  }, [backdrop, offset, screen, closing]);

  // Drag down to dismiss (only claims clearly vertical, downward moves so inputs and lists keep working).
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onPanResponderMove: (_, g) => {
          offset.set(Math.max(0, g.dy));
          backdrop.set(Math.max(0, 1 - g.dy / 400));
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 110 || g.vy > 0.9) ctx.close();
          else {
            offset.set(withSpring(0, { damping: 22, stiffness: 260 }));
            backdrop.set(withTiming(1, { duration: 150 }));
          }
        },
      }),
    [ctx, offset, backdrop]
  );

  const panelStyle = useAnimatedStyle(() => ({
    // Follow the keyboard; its height already covers the home-indicator area.
    transform: [{ translateY: offset.get() - Math.max(0, keyboard.height.get() - insets.bottom) }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));

  return (
    <SheetContext value={ctx}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => ctx.close()} accessibilityLabel="Fermer" />
        </Animated.View>
        <Animated.View style={[styles.panel, { maxHeight, paddingBottom: insets.bottom + Space.sm }, panelStyle]}>
          <View {...pan.panHandlers} style={styles.grabberZone}>
            <View style={styles.grabber} />
          </View>
          <View {...pan.panHandlers} style={{ flexShrink: 1 }}>
            {children}
          </View>
        </Animated.View>
      </View>
    </SheetContext>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  grabberZone: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  grabber: { width: 36, height: 5, borderRadius: 3, backgroundColor: Colors.borderStrong },
});
