import { Image } from 'expo-image';
import { router, useScrollToTop } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_ACTION_SPACE, BottomAction, useScrollReveal } from '@/components/bottom-action';
import { CollectionCard } from '@/components/collection-card';
import { collectionActions, editCollection } from '@/components/collection-menu';
import { Icons } from '@/components/icon';
import { Avatar, Button, Divider, EmptyState, IconButton, Skeleton, Txt } from '@/components/primitives';
import { NotifyCard } from '@/components/notify-card';
import { SantaCard } from '@/components/santa';
import { useToast } from '@/components/toast';
import { Colors, Radius, Space } from '@/constants/theme';
import { prefetch, useApi } from '@/hooks/use-api';
import { confirm, deleteCollection, setCollectionPublic, shareCollection } from '@/lib/actions';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { leaveSanta } from '@/lib/santa';
import type { CollectionSummary, Santa, User } from '@/lib/types';
import appIcon from '../../assets/images/logo-mark.png';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const reveal = useScrollReveal();
  const toast = useToast();
  const { user: cached } = useAuth();
  const { data: profile } = useApi<User>('/api/profile');
  const { data: stats } = useApi<{
    followersCount: number;
    followingCount: number;
  }>('/api/follows/me?tab=stats');
  const { data, error, loading, refreshing, refresh, mutate } = useApi<CollectionSummary[]>('/api/collections');
  // Secret Santas only show up while you're in (or invited to) one that isn't over (the API filters).
  const { data: santas, refresh: refreshSantas } = useApi<Santa[]>('/api/santas');
  const activeSantas = santas ?? [];
  const user = profile ?? cached;
  const lists = data ?? [];
  // Warm the next screens so they open instantly: the first lists and the friends feed.
  useEffect(() => {
    if (!data) return;
    data.slice(0, 6).forEach((c) => prefetch(`/api/collections/${c.id}`));
    prefetch('/api/follows/me?tab=friends-collections');
  }, [data]);

  const listRef = useRef<FlatList<CollectionSummary>>(null);
  useScrollToTop(listRef);

  async function togglePublic(c: CollectionSummary) {
    try {
      await setCollectionPublic(c.id, !c.isPublic);
      mutate(lists.map((x) => (x.id === c.id ? { ...x, isPublic: !c.isPublic } : x)));
      toast(c.isPublic ? 'Collection privée' : 'Collection publique');
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  async function remove(c: CollectionSummary) {
    const ok = await confirm(`Supprimer « ${c.name} » ?`, 'La collection et tous ses souhaits seront supprimés.', 'Supprimer');
    if (!ok) return;
    try {
      await deleteCollection(c.id);
      mutate(lists.filter((x) => x.id !== c.id));
      toast('Collection supprimée');
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  function share(c: CollectionSummary) {
    void shareCollection(c, c.role !== 'collaborator').then((madePublic) => {
      if (madePublic) mutate(lists.map((x) => (x.id === c.id ? { ...x, isPublic: true } : x)));
    });
  }

  const actionsFor = (c: CollectionSummary) =>
    collectionActions(c, c.role !== 'collaborator', {
      edit: () => editCollection(c),
      share: () => share(c),
      togglePublic: () => void togglePublic(c),
      remove: () => void remove(c),
    });

  const header = (
    <View>
      <View style={[styles.topBar, { paddingTop: insets.top + Space.sm }]}>
        <View style={styles.brand}>
          <Image alt="" source={appIcon} style={styles.logo} />
          <Txt variant="title2">Envly</Txt>
        </View>
        <View style={styles.topActions}>
          <IconButton icon={Icons.people} label="Amis" size={40} onPress={() => router.push('/friends')} />
          <Pressable onPress={() => router.push('/profile')} hitSlop={6} accessibilityRole="button" accessibilityLabel="Compte" style={styles.me}>
            <Avatar uri={user?.image} name={user?.name} size={30} />
          </Pressable>
        </View>
      </View>
      <Divider />

      <Pressable
        onPress={() => router.push('/profile')}
        accessibilityRole="button"
        accessibilityLabel="Voir mon profil"
        style={({ pressed }) => [styles.profile, pressed && { opacity: 0.7 }]}>
        <Avatar uri={user?.image} name={user?.name} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="headline" numberOfLines={1}>
            {user?.name ?? ''}
          </Txt>
          {!!user?.description && (
            <Txt variant="footnote" color="text2" numberOfLines={1}>
              {user.description}
            </Txt>
          )}
          <Txt variant="footnote" color="text3" numberOfLines={1}>
            {[
              stats ? `${stats.followingCount} abonnements` : null,
              stats ? `${stats.followersCount} abonnés` : null,
              data ? `${data.length} collections` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Txt>
        </View>
      </Pressable>
      <Divider style={{ marginHorizontal: Space.lg }} />

      <NotifyCard />

      {activeSantas.length > 0 && (
        <View style={{ paddingTop: Space.xl, gap: Space.md }}>
          {activeSantas.map((s) => (
            <SantaCard
              key={s.id}
              santa={s}
              onAccept={() => router.push({ pathname: '/santa/[id]', params: { id: s.id } })}
              onDecline={() =>
                void leaveSanta(s.id)
                  .then(refreshSantas)
                  .catch((e) => Alert.alert('Erreur', errorMessage(e)))
              }
            />
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Txt variant="headline">Mes collections</Txt>
        <Button
          title="Nouveau"
          icon={Icons.plus}
          variant="secondary"
          size="sm"
          style={{ borderRadius: Radius.pill }}
          onPress={() => router.push('/new-collection')}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <FlatList
        ref={listRef}
        style={{ backgroundColor: Colors.bg }}
        data={lists}
        keyExtractor={(c) => c.id}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingBottom: BOTTOM_ACTION_SPACE + insets.bottom + Space.xl,
        }}
        ItemSeparatorComponent={() => <View style={{ height: Space.lg }} />}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
              void refreshSantas();
            }}
            tintColor={Colors.text2}
          />
        }
        onScroll={reveal.onScroll}
        scrollEventThrottle={32}
        renderItem={({ item: c }) => (
          <View style={{ paddingHorizontal: Space.lg }}>
            <CollectionCard
              collection={c}
              href={{
                pathname: '/collection/[id]',
                params: { id: c.id, name: c.name },
              }}
              onShare={() => share(c)}
              actions={actionsFor(c)}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingHorizontal: Space.lg, gap: Space.lg }}>
              {[0, 1].map((i) => (
                <Skeleton key={i} style={{ height: 300, borderRadius: Radius.xl }} />
              ))}
            </View>
          ) : error ? (
            <EmptyState
              icon={Icons.gift}
              title="Impossible de charger"
              message={error}
              action={<Button title="Réessayer" variant="outline" size="md" onPress={refresh} />}
            />
          ) : (
            <EmptyState
              icon={Icons.gift}
              title="Aucune collection"
              message="Créez votre première collection, puis ajoutez des souhaits depuis n'importe quel site."
              action={<Button title="Nouvelle collection" icon={Icons.plus} size="md" onPress={() => router.push('/new-collection')} />}
            />
          )
        }
      />
      <View pointerEvents="none" style={[styles.statusBackdrop, { height: insets.top }]} />
      <BottomAction title="Ajouter" visible={reveal.visible} onPress={() => router.push('/add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Space.lg,
    paddingRight: Space.md,
    paddingBottom: Space.xs,
  },
  statusBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: Colors.bg },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  me: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 28, height: 30 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingVertical: Space.lg,
    paddingHorizontal: Space.lg,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.lg,
    paddingTop: Space.xl,
    paddingBottom: Space.lg,
  },
});
