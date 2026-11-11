import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Icon, Icons } from '@/components/icon';
import { Avatar, Button, Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { santaMeta } from '@/lib/santa';
import type { Person, Santa } from '@/lib/types';

const GOLD = '#E8C872';

/** Small "SECRET SANTA" label used on every Secret Santa surface. */
export function SantaEyebrow({ label = 'Secret Santa' }: { label?: string }) {
  return (
    <View style={styles.eyebrow}>
      <Icon name={Icons.gift} size={12} color={GOLD} />
      <Txt variant="micro" style={styles.eyebrowText}>
        {label.toUpperCase()}
      </Txt>
    </View>
  );
}

/** Overlapping avatars. */
export function AvatarStack({ people, max = 5, size = 26 }: { people: Person[]; max?: number; size?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <View key={p.id} style={[styles.stackItem, { marginLeft: i ? -size * 0.3 : 0, borderRadius: size }]}>
          <Avatar uri={p.image} name={p.name} size={size} />
        </View>
      ))}
      {rest > 0 && (
        <Txt variant="footnote" color="text2" style={{ marginLeft: 6 }}>
          +{rest}
        </Txt>
      )}
    </View>
  );
}

/** "Tu offres à …": hidden until tapped, then revealed with a small zoom. */
export function Reveal({ person, large }: { person: Person; large?: boolean }) {
  const [shown, setShown] = useState(false);
  const size = large ? 72 : 40;
  if (!shown) {
    return (
      <Pressable
        onPress={() => {
          haptic.success();
          setShown(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Révéler la personne tirée au sort"
        style={({ pressed }) => [styles.hidden, large && styles.hiddenLarge, pressed && { opacity: 0.7 }]}>
        <View style={[styles.mystery, { width: size, height: size, borderRadius: size / 2 }]}>
          <Txt style={{ color: GOLD, fontSize: size * 0.42, lineHeight: size * 0.52 }}>?</Txt>
        </View>
        <Txt variant={large ? 'headline' : 'bodyMedium'} color="text2">
          Toucher pour révéler
        </Txt>
      </Pressable>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(220)} style={[styles.revealed, large && { flexDirection: 'column', gap: Space.md }]}>
      <Animated.View entering={ZoomIn.springify().damping(14)}>
        <Avatar uri={person.image} name={person.name} size={size} />
      </Animated.View>
      <Txt variant={large ? 'title' : 'headline'} center={large}>
        {person.name ?? 'Quelqu’un'}
      </Txt>
    </Animated.View>
  );
}

/** Home card, shown only while you take part in (or are invited to) a Secret Santa. */
export function SantaCard({ santa, onAccept, onDecline }: { santa: Santa; onAccept: () => void; onDecline: () => void }) {
  const joined = santa.members.filter((m) => m.status === 'JOINED');
  const meta = santaMeta(santa);
  const open = () => router.push({ pathname: '/santa/[id]', params: { id: santa.id } });

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.cardTop}>
        <SantaEyebrow />
        {!!meta && (
          <Txt variant="footnote" color="text3">
            {meta}
          </Txt>
        )}
      </View>
      <Txt variant="title2" numberOfLines={1}>
        {santa.name}
      </Txt>

      {santa.me?.status === 'INVITED' ? (
        <View style={{ gap: Space.md }}>
          <Txt variant="subhead" color="text2">
            {santa.organizer.name ?? 'Un ami'} vous invite à participer.
          </Txt>
          <View style={{ flexDirection: 'row', gap: Space.sm }}>
            <Button title="Refuser" variant="outline" size="md" style={{ flex: 1 }} onPress={onDecline} />
            <Button title="Participer" size="md" style={{ flex: 1 }} onPress={onAccept} />
          </View>
        </View>
      ) : santa.status === 'DRAWN' && santa.assignment ? (
        <View style={{ gap: Space.sm }}>
          <Txt variant="subhead" color="text2">
            Vous offrez à
          </Txt>
          <Reveal person={santa.assignment.user} />
        </View>
      ) : (
        <View style={styles.waiting}>
          <AvatarStack people={joined} />
          <Txt variant="footnote" color="text2" style={{ flex: 1 }}>
            {joined.length} participant{joined.length > 1 ? 's' : ''} · tirage à venir
          </Txt>
          <Icon name={Icons.chevronRight} size={13} color={Colors.text3} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowText: { color: GOLD, letterSpacing: 1.4, fontSize: 11 },
  card: {
    marginHorizontal: Space.lg,
    padding: Space.lg,
    gap: Space.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(232,200,114,0.28)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  stackItem: { borderWidth: 2, borderColor: Colors.card },
  hidden: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(232,200,114,0.45)',
  },
  hiddenLarge: { flexDirection: 'column', paddingVertical: Space.xxl },
  mystery: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,200,114,0.12)' },
  revealed: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
});
