import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { Avatar, Button, EmptyState, Skeleton, Txt } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { Sheet, useSheet } from '@/components/sheet';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { inviteToSanta, shareSantaLink } from '@/lib/santa';
import type { Person, Santa } from '@/lib/types';

/** Pick people among the ones you follow or who follow you. */
function InviteSheetContent() {
  const toast = useToast();
  const { close } = useSheet();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: santa } = useApi<Santa>(`/api/santas/${id}`);
  const { data: following } = useApi<Person[]>('/api/follows/me?tab=following');
  const { data: followers } = useApi<Person[]>('/api/follows/me?tab=followers');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const already = new Set(santa?.members.map((m) => m.id));
  const people: Person[] = [];
  for (const p of [...(following ?? []), ...(followers ?? [])]) {
    if (!already.has(p.id) && !people.some((x) => x.id === p.id)) people.push(p);
  }
  const loading = !following || !followers;

  function toggle(uid: string) {
    haptic.select();
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function send() {
    setSaving(true);
    setError(null);
    try {
      await inviteToSanta(id, [...picked]);
      haptic.success();
      toast(picked.size > 1 ? `${picked.size} invitations envoyées` : 'Invitation envoyée');
      close();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <View style={{ flexShrink: 1 }}>
      <View style={styles.header}>
        <Txt variant="title2">Inviter des amis</Txt>
        <Txt variant="subhead" color="text2">
          Ils verront l’invitation sur leur accueil Envly.
        </Txt>
      </View>
      <FlatList
        style={{ flexGrow: 0 }}
        data={people}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: Space.lg }}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: Space.lg, gap: Space.md }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 48, borderRadius: Radius.md }} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={Icons.people}
              title="Personne à inviter"
              message="Partagez plutôt le lien : n’importe qui avec un compte Envly peut rejoindre."
              action={santa ? <Button title="Partager le lien" size="md" onPress={() => void shareSantaLink(santa)} /> : undefined}
            />
          )
        }
        renderItem={({ item }) => {
          const on = picked.has(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.card }]}>
              <Avatar uri={item.image} name={item.name} size={40} />
              <Txt variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                {item.name ?? 'Utilisateur'}
              </Txt>
              <View style={[styles.check, on && styles.checkOn]}>{on && <Icon name={Icons.check} size={13} color={Colors.bg} weight="bold" />}</View>
            </Pressable>
          );
        }}
      />
      <View style={styles.footer}>
        {!!error && (
          <Txt variant="footnote" color="danger" center>
            {error}
          </Txt>
        )}
        <Button
          title={picked.size ? `Inviter ${picked.size} personne${picked.size > 1 ? 's' : ''}` : 'Inviter'}
          disabled={!picked.size}
          loading={saving}
          onPress={send}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Space.xl, paddingTop: Space.md, paddingBottom: Space.lg, gap: Space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.xl, paddingVertical: 10 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: Colors.text, borderColor: Colors.text },
  footer: { paddingHorizontal: Space.xl, paddingTop: Space.md, gap: Space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
});

export default function InviteSheet() {
  return (
    <Sheet maxHeight="80%">
      <InviteSheetContent />
    </Sheet>
  );
}
