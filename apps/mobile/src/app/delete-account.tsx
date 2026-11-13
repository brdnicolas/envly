import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { NavBar } from '@/components/nav-bar';
import { Button, Field, Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';

const WORD = 'SUPPRIMER';

/**
 * Account deletion, kept away from "Se déconnecter" on purpose: a full screen that says what will be lost,
 * offers the harmless way out (sign out), and only enables the button once SUPPRIMER is typed.
 */
export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const armed = typed.trim().toUpperCase() === WORD;

  async function remove() {
    if (!armed || deleting) return;
    setDeleting(true);
    try {
      await api('/api/account/delete', { method: 'DELETE', body: { confirm: WORD } });
      haptic.success();
      await signOut();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
      setDeleting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <NavBar title="Supprimer mon compte" />
      <KeyboardAwareScrollView bottomOffset={24} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xl }]}>
          <View style={styles.warning}>
            <Icon name={Icons.trash} size={22} color={Colors.danger} />
          </View>
          <Txt variant="title2">C’est définitif</Txt>
          <Txt variant="body" color="text2">
            Supprimer le compte {user?.email ? <Txt variant="body" style={{ color: Colors.text }}>{user.email}</Txt> : null} efface immédiatement et
            pour toujours :
          </Txt>
          <View style={{ gap: Space.sm }}>
            {['Toutes vos listes et vos envies', 'Vos amis, abonnés et abonnements', 'Vos Secret Santa et vos réservations', 'Les liens que vous avez partagés (ils ne marcheront plus)'].map((t) => (
              <View key={t} style={styles.point}>
                <View style={styles.dot} />
                <Txt variant="subhead" color="text2" style={{ flex: 1 }}>
                  {t}
                </Txt>
              </View>
            ))}
          </View>

          <View style={styles.signOutHint}>
            <Txt variant="subhead" color="text2">
              Vous voulez juste quitter l’app un moment ? Déconnectez-vous plutôt : tout sera là à votre retour.
            </Txt>
            <Button title="Me déconnecter" variant="secondary" size="md" onPress={() => void signOut()} />
          </View>

          <Field
            label={`Pour confirmer, tapez ${WORD}`}
            value={typed}
            onChangeText={setTyped}
            placeholder={WORD}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
          />
          <Button title="Supprimer définitivement mon compte" variant={armed ? 'destructive' : 'outline'} disabled={!armed} loading={deleting} onPress={() => void remove()} />
          <Button title="Annuler" variant="ghost" onPress={() => router.back()} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Space.xl, paddingTop: Space.lg, gap: Space.lg },
  warning: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,100,103,0.12)' },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.danger, marginTop: 8 },
  signOutHint: { gap: Space.md, padding: Space.lg, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
});
