import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/icon';
import { Colors, Fonts, Radius, Space, Type, type TypeVariant } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

type TxtProps = TextProps & {
  variant?: TypeVariant;
  color?: keyof typeof Colors | (string & {});
  center?: boolean;
};

export function Txt({ variant = 'body', color = 'text', center, style, ...props }: TxtProps) {
  const c = (Colors as Record<string, string>)[color] ?? color;
  return <Text {...props} style={[Type[variant] as TextStyle, { color: c }, center && { textAlign: 'center' }, style]} />;
}

// ---------------------------------------------------------------------------
// Touchables — subtle opacity feedback, no bounce
// ---------------------------------------------------------------------------

export function Touchable({ style, ...props }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  return <Pressable {...props} style={({ pressed }) => [style, pressed && { opacity: 0.6 }]} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  loading,
  disabled,
  size = 'lg',
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: Colors.primary, fg: Colors.onPrimary },
    secondary: { bg: Colors.muted, fg: Colors.text },
    outline: { bg: 'transparent', fg: Colors.text, border: Colors.borderStrong },
    ghost: { bg: 'transparent', fg: Colors.text2 },
    destructive: { bg: 'transparent', fg: Colors.danger },
  };
  const { bg, fg, border } = palette[variant];
  const height = size === 'lg' ? 50 : size === 'md' ? 42 : 34;
  const fontSize = size === 'sm' ? 13 : 15;
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          height,
          paddingHorizontal: size === 'sm' ? 12 : 18,
          borderRadius: size === 'lg' ? Radius.md : Radius.pill,
          opacity: disabled ? 0.4 : 1,
        },
        border && { borderWidth: 1, borderColor: border },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={fontSize + 1} color={fg} />}
          <Text style={{ fontFamily: Fonts.medium, fontSize, color: fg, letterSpacing: -0.1 }}>{title}</Text>
          {iconRight && <Icon name={iconRight} size={fontSize} color={fg} />}
        </>
      )}
    </Touchable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  filled,
  size = 36,
  color = Colors.text,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  filled?: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={[
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        filled && { backgroundColor: Colors.scrim },
      ]}>
      <Icon name={icon} size={Math.round(size * 0.5)} color={color} />
    </Touchable>
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export function Field({
  label,
  style,
  containerStyle,
  right,
  ...props
}: TextInputProps & { label?: string; containerStyle?: StyleProp<ViewStyle>; right?: ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: Space.sm }, containerStyle]}>
      {label && <Txt variant="callout">{label}</Txt>}
      <View
        style={[
          styles.field,
          { borderColor: focused ? Colors.text3 : Colors.border },
          props.multiline && { alignItems: 'flex-start' },
        ]}>
        <TextInput
          placeholderTextColor={Colors.text3}
          selectionColor={Colors.text}
          cursorColor={Colors.text}
          keyboardAppearance="dark"
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            Type.body,
            { flex: 1, color: Colors.text, paddingVertical: 13 },
            props.multiline && { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
            style,
          ]}
        />
        {right}
      </View>
    </View>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: Colors.bg }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <Txt variant="callout" color={active ? 'text' : 'text2'}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Touchable
      onPress={onPress}
      style={[
        styles.chip,
        selected ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : { borderColor: Colors.border },
      ]}>
      <Txt variant="callout" style={{ color: selected ? Colors.onPrimary : Colors.text }}>
        {label}
      </Txt>
    </Touchable>
  );
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: 'neutral' | 'light' | 'success'; icon?: IconName }) {
  const s =
    tone === 'light'
      ? { bg: Colors.primary, fg: Colors.onPrimary, border: Colors.primary }
      : tone === 'success'
        ? { bg: Colors.successBg, fg: Colors.success, border: Colors.successBorder }
        : { bg: Colors.muted, fg: Colors.text2, border: Colors.muted };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
      {icon && <Icon name={icon} size={12} color={s.fg} />}
      <Txt variant="caption" style={{ color: s.fg }}>
        {label}
      </Txt>
    </View>
  );
}

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ backgroundColor: Colors.card, borderRadius: Radius.md }, style, animated]} />;
}

export function Avatar({ uri, name, size = 40 }: { uri?: string | null; name?: string | null; size?: number }) {
  const initial = (name?.trim()[0] ?? '?').toUpperCase();
  return uri ? (
    <Image alt="" source={uri} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.muted }} transition={150} />
  ) : (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.muted, alignItems: 'center', justifyContent: 'center' }}>
      <Txt style={{ fontFamily: Fonts.semibold, fontSize: size * 0.4 }} color="text2">
        {initial}
      </Txt>
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: IconName; title: string; message?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={22} color={Colors.text2} />
      </View>
      <Txt variant="headline" center>
        {title}
      </Txt>
      {message && (
        <Txt variant="subhead" color="text2" center style={{ maxWidth: 280 }}>
          {message}
        </Txt>
      )}
      {action && <View style={{ marginTop: Space.md }}>{action}</View>}
    </View>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Txt variant="footnote" color="danger">
      {message}
    </Txt>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.border }, style]} />;
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: Space.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  segmented: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 4, alignSelf: 'flex-start' },
  segment: { paddingHorizontal: 16, height: 36, borderRadius: Radius.md, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: Radius.pill, justifyContent: 'center', borderWidth: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 24, borderRadius: Radius.pill, borderWidth: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: Space.xxl, gap: Space.sm },
  emptyIcon: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: Space.sm },
});
