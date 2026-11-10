import { Stack } from 'expo-router';

import { Colors, Fonts } from '@/constants/theme';

export default function ListsLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: Colors.text,
        headerStyle: { backgroundColor: Colors.bg },
        headerTitleStyle: { fontFamily: Fonts.semibold, fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
        fullScreenGestureEnabled: true,
        statusBarStyle: 'light',
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="collection/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
