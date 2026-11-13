import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionCard } from '@/components/collection-card';
import { CollectionMenu } from '@/components/collection-menu';
import { Icons } from '@/components/icon';
import { NavBar } from '@/components/nav-bar';
import { Avatar, Badge, Button, EmptyState, Skeleton, Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage, publicProfileUrl } from '@/lib/api';
import { firstName } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { blockUser, reportUser, setFollowing, unblockUser } from '@/lib/social';
import type { PublicProfile } from '@/lib/types';

/** A friend's profile: who they are, follow state, and their public lists. */
export default function UserScreen() {
  const insets = useSafeAreaInsets();
  // `name`/`image` are passed by the screen we come from, so the header is drawn before the request lands.
  const { id, name: hintName, image: hintImage } = useLocalSearchParams<{ id: string; name?: string; image?: string }>();
  const { data, error, refreshing, refresh, mutate } = useApi<PublicProfile>(`/api/users/${id}`);
  const [busy, setBusy] = useState(false);

  const name = data?.name ?? hintName ?? 'Utilisateur';
  const first = firstName(name) || name;

  async function toggleFollow() {
    if (!data || busy) return;
    const follow = !data.isFollowing;
    if (!follow) {
      const ok = await new Promise<boolean>((resolve) =>
        Alert.alert(`Ne plus suivre ${first} ?`, 'Ses listes ne seront plus dans votre fil.', [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Ne plus suivre', style: 'destructive', onPress: () => resolve(true) },
        ])
      );
      if (!ok) return;
    }
    haptic.select();
    setBusy(true);
    const before = data;
    mutate({ ...data, isFollowing: follow, followersCount: data.followersCount + (follow ? 1 : -1) });
    try {
      await setFollowing(data.id, follow);
      if (follow) haptic.success();
    } catch (e) {
      mutate(before);
      Alert.alert('Erreur', errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const share = data?.slug
    ? () => void Share.share({ url: publicProfileUrl(data.slug!), message: `Les envies de ${first} sur Envly` })
    : undefined;

  async function unblock() {
    if (!data) return;
    try {
      await unblockUser(data.id);
      haptic.success();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  const target = data ? { userId: data.id, name: data.name } : null;
  const menu = data && target
    ? [
        share ? [{ label: 'Partager le profil', icon: 'square.and.arrow.up', onPress: share }] : [],
        data.isMe
          ? []
          : [
              { label: 'Signaler', icon: 'flag', onPress: () => reportUser(target, () => router.back()) },
              data.isBlocked
                ? { label: 'Débloquer', icon: 'hand.raised.slash', onPress: () => void unblock() }
                : { label: 'Bloquer', icon: 'hand.raised', destructive: true, onPress: () => void blockUser(target).then((ok) => ok && router.back()) },
            ],
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <NavBar right={menu.some((g) => g.length) ? <CollectionMenu groups={menu} /> : undefined} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + Space.x3 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text2} />}>
        {/* Identity */}
        <View style={styles.hero}>
          <View style={styles.avatarGlow}>
            <Avatar uri={data?.image ?? hintImage} name={name} size={92} />
          </View>
          <Txt variant="title" center style={{ marginTop: Space.lg }}>
            {name}
          </Txt>
          {data?.followsMe && !data.isMe && (
            <View style={{ marginTop: Space.sm }}>
              <Badge label="Vous suit" />
            </View>
          )}
          {!!data?.description && (
            <Txt variant="subhead" color="text2" center style={{ marginTop: Space.sm, maxWidth: 320 }}>
              {data.description}
            </Txt>
          )}

          {/* Stats */}
          <View style={styles.stats}>
            {[
              { n: data?.collections.length, label: 'listes' },
              { n: data?.wishCount, label: 'envies' },
              { n: data?.followersCount, label: 'abonnés' },
            ].map((s, i) => (
              <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
                {s.n === undefined ? (
                  <Skeleton style={{ width: 28, height: 22, borderRadius: 6 }} />
                ) : (
                  <Txt variant="title2" style={{ fontVariant: ['tabular-nums'] }}>
                    {s.n}
                  </Txt>
                )}
                <Txt variant="caption" color="text3">
                  {s.label}
                </Txt>
              </View>
            ))}
          </View>

          {data?.isBlocked && (
            <View style={styles.blocked}>
              <Txt variant="subhead" color="text2" center>
                Vous avez bloqué {first}. Vous ne voyez plus ses listes et ne vous suivez plus.
              </Txt>
              <Button title="Débloquer" variant="secondary" size="md" onPress={() => void unblock()} />
            </View>
          )}
          {data && !data.isMe && !data.isBlocked && (
            <Button
              title={data.isFollowing ? 'Abonné' : data.followsMe ? 'Suivre en retour' : 'Suivre'}
              icon={data.isFollowing ? Icons.check : Icons.plus}
              variant={data.isFollowing ? 'secondary' : 'primary'}
              size="md"
              onPress={toggleFollow}
              style={{ marginTop: Space.xl, minWidth: 180 }}
            />
          )}
        </View>

        {/* Lists */}
        <View style={styles.section}>
          <Txt variant="headline">{data?.isMe ? 'Mes listes publiques' : `Les listes de ${first}`}</Txt>
        </View>
        <View style={{ paddingHorizontal: Space.lg, gap: Space.lg }}>
          {!data && !error && [0, 1].map((i) => <Skeleton key={i} style={{ height: 250, borderRadius: Radius.xl }} />)}
          {error && !data && (
            <EmptyState
              icon={Icons.person}
              title="Profil introuvable"
              message={error}
              action={<Button title="Réessayer" variant="outline" size="md" onPress={refresh} />}
            />
          )}
          {data?.collections.length === 0 && !data.isBlocked && (
            <EmptyState
              icon={Icons.gift}
              title="Pas encore de liste publique"
              message={`Quand ${first} partagera une liste, elle apparaîtra ici.`}
            />
          )}
          {data?.collections.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              onPress={() => router.push({ pathname: '/collection/[id]', params: { id: c.id, name: c.name } })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingHorizontal: Space.xl, paddingTop: Space.md, paddingBottom: Space.xl },
  avatarGlow: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  stats: {
    flexDirection: 'row',
    marginTop: Space.xl,
    paddingVertical: Space.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignSelf: 'stretch',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: Colors.border },
  section: { paddingHorizontal: Space.lg, paddingTop: Space.md, paddingBottom: Space.md },
  blocked: { marginTop: Space.xl, gap: Space.md, alignItems: 'center', padding: Space.lg, borderRadius: Radius.lg, backgroundColor: Colors.card, alignSelf: 'stretch' },
});
