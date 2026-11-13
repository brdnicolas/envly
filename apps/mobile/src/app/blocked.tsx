import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Button, Txt } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { Colors, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { unblockUser } from '@/lib/social';
import type { BlockedUser } from '@/lib/types';

/** Bottom sheet: the people I blocked, with "Débloquer". */
function BlockedContent() {
  const { data, mutate } = useApi<BlockedUser[]>('/api/blocks');
  const [busy, setBusy] = useState<string | null>(null);

  async function unblock(u: BlockedUser) {
    setBusy(u.id);
    try {
      await unblockUser(u.id);
      haptic.success();
      mutate((data ?? []).filter((x) => x.id !== u.id));
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ paddingBottom: Space.lg }}>
      <View style={styles.head}>
        <Txt variant="title2">Utilisateurs bloqués</Txt>
        <Txt variant="footnote" color="text2">
          Ils ne voient plus votre profil ni vos listes dans l’app, et ne peuvent plus vous suivre.
        </Txt>
      </View>
      <ScrollView style={{ maxHeight: 420 }}>
        {data?.length === 0 && (
          <Txt variant="subhead" color="text3" center style={{ padding: Space.xl }}>
            Vous n’avez bloqué personne.
          </Txt>
        )}
        {data?.map((u) => (
          <View key={u.id} style={styles.row}>
            <Avatar uri={u.image} name={u.name} size={44} />
            <Txt variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
              {u.name ?? 'Utilisateur'}
            </Txt>
            <Button title="Débloquer" size="sm" variant="secondary" loading={busy === u.id} onPress={() => void unblock(u)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function BlockedSheet() {
  return (
    <Sheet maxHeight="80%">
      <BlockedContent />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: Space.lg, paddingTop: Space.sm, paddingBottom: Space.md, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.lg, paddingVertical: Space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
});
