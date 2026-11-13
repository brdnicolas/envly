import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons, type IconName } from '@/components/icon';
import { NavBar } from '@/components/nav-bar';
import { Avatar, Divider, Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { confirm } from '@/lib/actions';
import { API_URL, publicProfileUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { User } from '@/lib/types';

const openWeb = (path: string) =>
  WebBrowser.openBrowserAsync(`${API_URL}${path}`, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: Colors.bg,
    controlsColor: Colors.text,
  });

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user: cached, signOut } = useAuth();
  const { data } = useApi<User>('/api/profile');
  const user = data ?? cached;

  async function logout() {
    if (await confirm('Se déconnecter ?', 'Vous pourrez vous reconnecter à tout moment.', 'Se déconnecter', false)) await signOut();
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <NavBar title="Compte" />
      <ScrollView
        style={{ backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingTop: Space.lg, paddingBottom: insets.bottom + Space.x3, gap: Space.xxl }}>
        <View style={styles.identity}>
          <Avatar uri={user?.image} name={user?.name} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="headline">{user?.name ?? ''}</Txt>
            <Txt variant="footnote" color="text2">
              {user?.email}
            </Txt>
          </View>
        </View>

        <Section>
          {!!user?.slug && (
            <Row
              icon={Icons.share}
              label="Partager mon profil"
              onPress={() => void Share.share({ message: publicProfileUrl(user.slug!), url: publicProfileUrl(user.slug!) })}
            />
          )}
          <Row icon={Icons.people} label="Trouver des amis" onPress={() => router.push('/friends-search')} />
        </Section>

        <Section>
          <Row icon={Icons.gear} label="Paramètres du compte" onPress={() => void openWeb('/settings')} />
          <Row icon={Icons.hand} label="Utilisateurs bloqués" onPress={() => router.push('/blocked')} />
          <Row icon={Icons.envelope} label="Aide et contact" onPress={() => void openWeb('/support')} />
          <Row icon={Icons.hand} label="Confidentialité" onPress={() => void openWeb('/privacy.html')} />
        </Section>

        <Section>
          <Row icon={Icons.logout} label="Se déconnecter" onPress={logout} chevron={false} />
        </Section>

        <View style={{ alignItems: 'center', gap: Space.md, paddingTop: Space.x3 }}>
          <Txt variant="micro" color="text3" center>
            Envly {Constants.expoConfig?.version}
          </Txt>
          {/* Deliberately away from "Se déconnecter", and it opens a screen, not a one-tap confirm. */}
          <Pressable onPress={() => router.push('/delete-account')} hitSlop={8} accessibilityRole="button">
            <Txt variant="footnote" color="text3" style={{ textDecorationLine: 'underline' }}>
              Supprimer mon compte
            </Txt>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <View style={styles.section}>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 && <Divider style={{ marginLeft: 50 }} />}
          {child}
        </View>
      ))}
    </View>
  );
}

function Row({ icon, label, onPress, danger, chevron = true }: { icon: IconName; label: string; onPress: () => void; danger?: boolean; chevron?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.elevated }]}>
      <Icon name={icon} size={18} color={danger ? Colors.danger : Colors.text2} />
      <Txt variant="bodyMedium" style={{ flex: 1, color: danger ? Colors.danger : Colors.text }}>
        {label}
      </Txt>
      {chevron && <Icon name={Icons.chevronRight} size={13} color={Colors.text3} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: Space.lg, marginHorizontal: Space.lg },
  section: {
    marginHorizontal: Space.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.lg, paddingHorizontal: Space.lg, height: 52 },
});
