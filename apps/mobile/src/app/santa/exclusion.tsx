import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Txt } from '@/components/primitives';
import { Sheet, useSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';
import { updateSanta } from '@/lib/santa';
import type { Santa } from '@/lib/types';

const GOLD = '#E8C872';

/** Organizer: pick two participants who must not draw each other. */
function ExclusionContent() {
  const toast = useToast();
  const { close } = useSheet();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: santa, mutate } = useApi<Santa>(`/api/santas/${id}`);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const joined = (santa?.members ?? []).filter((m) => m.status === 'JOINED');
  const name = (uid: string) => (uid === user?.id ? 'Vous' : (joined.find((m) => m.id === uid)?.name ?? 'Participant'));
  const already = (a: string, b: string) => santa?.exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

  function toggle(uid: string) {
    haptic.select();
    setPicked((p) => (p.includes(uid) ? p.filter((x) => x !== uid) : p.length < 2 ? [...p, uid] : [p[1], uid]));
  }

  async function save() {
    if (!santa || picked.length !== 2) return;
    setSaving(true);
    try {
      const next = await updateSanta(santa.id, { exclusions: [...santa.exclusions, [picked[0], picked[1]]] });
      mutate(next);
      haptic.success();
      toast('Exclusion ajoutée');
      close();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
      setSaving(false);
    }
  }

  const ready = picked.length === 2 && !already(picked[0], picked[1]);

  return (
    <View style={styles.container}>
      <View style={{ gap: Space.xs }}>
        <Txt variant="title2">Ajouter une exclusion</Txt>
        <Txt variant="subhead" color="text2">
          Choisissez deux personnes qui ne pourront pas se tirer au sort entre elles.
        </Txt>
      </View>
      <View style={styles.grid}>
        {joined.map((m) => {
          const on = picked.includes(m.id);
          return (
            <Pressable key={m.id} onPress={() => toggle(m.id)} style={styles.person}>
              <View style={[styles.ring, on && { borderColor: GOLD }]}>
                <Avatar uri={m.image} name={m.name} size={52} />
              </View>
              <Txt variant="micro" numberOfLines={1} center style={{ maxWidth: 72, color: on ? Colors.text : Colors.text2 }}>
                {m.id === user?.id ? 'Vous' : (m.name ?? 'Invité').split(' ')[0]}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <Txt variant="footnote" color="text3" center>
        {picked.length === 2
          ? already(picked[0], picked[1])
            ? 'Cette exclusion existe déjà.'
            : `${name(picked[0])} et ${name(picked[1])} ne se tireront pas entre eux.`
          : `Sélectionnez ${2 - picked.length} personne${picked.length ? '' : 's'}.`}
      </Txt>
      <Button title="Ajouter" onPress={() => void save()} loading={saving} disabled={!ready} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Space.xl, paddingTop: Space.sm, paddingBottom: Space.md, gap: Space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.lg, justifyContent: 'center' },
  person: { alignItems: 'center', gap: 6, width: 64 },
  ring: { padding: 2, borderRadius: Radius.pill, borderWidth: 2, borderColor: 'transparent' },
});

export default function SantaExclusionScreen() {
  return (
    <Sheet>
      <ExclusionContent />
    </Sheet>
  );
}
