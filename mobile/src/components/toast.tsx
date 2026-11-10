import { createContext, use, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';

type Toast = { id: number; message: string };
const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show(message: string) {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = setTimeout(() => setToast(null), 2200);
  }

  return (
    <ToastContext value={show}>
      {children}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + Space.sm, alignItems: 'center' }]}>
        {toast && (
          <Animated.View key={toast.id} entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.toast}>
            <Icon name={Icons.check} size={14} color={Colors.text} weight="semibold" />
            <Txt variant="callout" numberOfLines={2}>
              {toast.message}
            </Txt>
          </Animated.View>
        )}
      </View>
    </ToastContext>
  );
}

export function useToast() {
  return use(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingHorizontal: Space.lg,
    paddingVertical: 11,
    borderRadius: Radius.md,
    maxWidth: '90%',
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
