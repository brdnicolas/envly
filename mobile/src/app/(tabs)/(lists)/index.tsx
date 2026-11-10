import { Image } from 'expo-image';
import { router, useScrollToTop } from 'expo-router';
import { useRef } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddMenu } from '@/components/add-menu';
import { CollectionCard } from '@/components/collection-card';
import { Icons } from '@/components/icon';
import { Avatar, Button, Divider, EmptyState, Skeleton, Txt } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { actionSheet, confirm, deleteCollection, setCollectionPublic, shareCollection } from '@/lib/actions';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { CollectionSummary, User } from '@/lib/types';
import appIcon from '../../../../assets/images/icon.png';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user: cached } = useAuth();
  const { data: profile } = useApi<User>('/api/profile');
  const { data: stats } = useApi<{ followersCount: number; followingCount: number }>('/api/follows/me?tab=stats');
  const { data, error, loading, refreshing, refresh, mutate } = useApi<CollectionSummary[]>('/api/collections');
  const user = profile ?? cached;
  const lists = data ?? [];
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

  function more(c: CollectionSummary) {
    const owner = c.role !== 'collaborator';
    actionSheet(c.name, [
      { label: 'Partager', onPress: () => share(c) },
      ...(owner
        ? [
            { label: c.isPublic ? 'Rendre privée' : 'Rendre publique', onPress: () => void togglePublic(c) },
            { label: 'Supprimer', destructive: true, onPress: () => void remove(c) },
          ]
        : []),
    ]);
  }

  const header = (
    <View>
      <View style={[styles.topBar, { paddingTop: insets.top + Space.sm }]}>
        <View style={styles.brand}>
          <Image alt="" source={appIcon} style={styles.logo} />
          <Txt variant="title2">Envly</Txt>
        </View>
        <AddMenu />
      </View>
      <Divider />

      <View style={styles.profile}>
        <Avatar uri={user?.image} name={user?.name} size={80} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Txt variant="title2">{user?.name ?? ''}</Txt>
          {!!user?.description && (
            <Txt variant="subhead" color="text2" center>
              {user.description}
            </Txt>
          )}
        </View>
        <View style={styles.stats}>
          <Stat value={stats?.followingCount} label="abonnements" />
          <Stat value={stats?.followersCount} label="abonnés" />
          <Txt color="text3">·</Txt>
          <Stat value={data?.length} label="collections" />
        </View>
      </View>
      <Divider style={{ marginHorizontal: Space.lg }} />

      <View style={styles.sectionHeader}>
        <Txt variant="headline">Mes collections</Txt>
        <Button title="Nouveau" icon={Icons.plus} variant="primary" size="sm" style={{ borderRadius: Radius.pill }} onPress={() => router.push('/new-collection')} />
      </View>
    </View>
  );

  return (
    <FlatList
      ref={listRef}
      style={{ backgroundColor: Colors.bg }}
      data={lists}
      keyExtractor={(c) => c.id}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingBottom: Space.x3 }}
      ItemSeparatorComponent={() => <View style={{ height: Space.lg }} />}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text2} />}
      renderItem={({ item: c }) => (
        <View style={{ paddingHorizontal: Space.lg }}>
          <CollectionCard
            collection={c}
            href={{ pathname: '/collection/[id]', params: { id: c.id, name: c.name } }}
            onShare={() => share(c)}
            onMore={() => more(c)}
            menu={{
              onShare: () => share(c),
              onTogglePublic: c.role === 'collaborator' ? undefined : () => void togglePublic(c),
              onDelete: c.role === 'collaborator' ? undefined : () => void remove(c),
            }}
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
          <EmptyState icon={Icons.gift} title="Impossible de charger" message={error} action={<Button title="Réessayer" variant="outline" size="md" onPress={refresh} />} />
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
  );
}

function Stat({ value, label }: { value?: number; label: string }) {
  return (
    <Txt variant="subhead" color="text2">
      <Txt variant="bodyMedium" style={{ fontSize: 14 }}>
        {value ?? '–'}
      </Txt>{' '}
      {label}
    </Txt>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: Space.lg, paddingRight: Space.xs, paddingBottom: Space.xs },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 32, height: 32, borderRadius: 8 },
  profile: { alignItems: 'center', gap: Space.md, paddingVertical: Space.xxl, paddingHorizontal: Space.xl },
  stats: { flexDirection: 'row', alignItems: 'center', gap: Space.md, flexWrap: 'wrap', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.lg, paddingTop: Space.xl, paddingBottom: Space.lg },
});
