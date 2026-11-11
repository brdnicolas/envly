import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const on = Platform.OS === 'ios' || Platform.OS === 'android';

/** Haptics are used sparingly: selections and outcomes only. */
export const haptic = {
  select: () => on && void Haptics.selectionAsync(),
  success: () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
