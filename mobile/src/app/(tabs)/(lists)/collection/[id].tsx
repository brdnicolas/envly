import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { Avatar, Badge, Button, EmptyState, IconButton, Skeleton, Txt } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { Masonry, WishCard } from '@/components/wish-card';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import {
  actionSheet,
  confirm,
  deleteCollection,
  deleteWish,
  openProduct,
  setCollectionPublic,
  shareCollection,
  updateWish,
} from '@/lib/actions';
import { errorMessage, publicCollectionUrl } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import type { CollectionDetail, Wish } from '@/lib/types';

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { data, error, loading, refreshing, refresh, mutate } = useApi<CollectionDetail>(`/api/collections/${id}`);

  const isOwner = data?.role === 'owner';
  const wishes = data?.wishes ?? [];
  const addHref = () => router.push({ pathname: '/add', params: { collectionId: id } });

  async function togglePublic() {
    if (!data) return;
    try {
      await setCollectionPublic(data.id, !data.isPublic);
      mutate({ ...data, isPublic: !data.isPublic });
      toast(data.isPublic ? 'Collection privée' : 'Collection publique');
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  async function copyLink() {
    if (!data) return;
    if (!data.isPublic) return void share();
    await Clipboard.setStringAsync(publicCollectionUrl(data.slug));
    haptic.success();
    toast('Lien copié');
  }

  async function share() {
    if (!data) return;
    const madePublic = await shareCollection(data, isOwner);
    if (madePublic) mutate({ ...data, isPublic: true });
  }

  async function removeList() {
    if (!data) return;
    const ok = await confirm(`Supprimer « ${data.name} » ?`, 'La collection et tous ses souhaits seront supprimés.', 'Supprimer');
    if (!ok) return;
    try {
      await deleteCollection(data.id);
      toast('Collection supprimée');
      router.back();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  async function togglePriority(w: Wish) {
    if (!data) return;
    mutate({ ...data, wishes: data.wishes.map((x) => (x.id === w.id ? { ...x, isPriority: !w.isPriority } : x)) });
    try {
      await updateWish(w.id, { isPriority: !w.isPriority });
    } catch (e) {
      mutate(data);
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  async function removeWish(w: Wish) {
    if (!data) return;
    const ok = await confirm('Supprimer ce souhait ?', w.title, 'Supprimer');
    if (!ok) return;
    mutate({ ...data, wishes: data.wishes.filter((x) => x.id !== w.id) });
    try {
      await deleteWish(w.id);
      toast('Souhait supprimé');
    } catch (e) {
      mutate(data);
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  function more() {
    if (!data) return;
    actionSheet(data.name, [
      { label: 'Partager', onPress: () => void share() },
      { label: 'Copier le lien', onPress: () => void copyLink() },
      ...(isOwner
        ? [
            { label: data.isPublic ? 'Rendre privée' : 'Rendre publique', onPress: () => void togglePublic() },
            { label: 'Supprimer la collection', destructive: true, onPress: () => void removeList() },
          ]
        : []),
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.navBar, { paddingTop: insets.top }]}>
        <IconButton icon={Icons.chevronLeft} label="Retour" onPress={() => router.back()} />
        <Txt variant="headline" numberOfLines={1} style={styles.navTitle}>
          {data?.name ?? name ?? ''}
        </Txt>
        <IconButton icon={Icons.more} label="Options" onPress={more} />
      </View>
      <ScrollView
        style={{ backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingHorizontal: Space.lg, paddingBottom: insets.bottom + Space.x3, gap: Space.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text2} />}>
        {data ? (
          <View style={{ gap: Space.md }}>
            {!!data.description && (
              <Txt variant="subhead" color="text2">
                {data.description}
              </Txt>
            )}
            <View style={styles.actions}>
              <Avatar uri={data.user.image} name={data.user.name} size={28} />
              {isOwner ? (
                <Pressable onPress={togglePublic} hitSlop={6} accessibilityRole="button" accessibilityLabel={data.isPublic ? 'Rendre privée' : 'Rendre publique'}>
                  {data.isPublic ? <Badge label="Publique" tone="success" icon={Icons.globe} /> : <Badge label="Privée" icon={Icons.lock} />}
                </Pressable>
              ) : data.isPublic ? (
                <Badge label="Publique" tone="success" icon={Icons.globe} />
              ) : (
                <Badge label="Privée" icon={Icons.lock} />
              )}
              <Txt variant="footnote" color="text3" numberOfLines={1} style={{ flex: 1 }}>
                {wishes.length} souhait{wishes.length > 1 ? 's' : ''}
              </Txt>
              <Button title="Ajouter" icon={Icons.plus} size="sm" onPress={addHref} />
            </View>
          </View>
        ) : (
          <Skeleton style={{ height: 28, width: '70%' }} />
        )}

        {wishes.length > 0 ? (
          <Masonry
            items={wishes}
            render={(w) => (
              <WishCard
                wish={w}
                href={{ pathname: '/wish/[id]', params: { id: w.id, collectionId: id } }}
                onOpenProduct={w.url ? () => openProduct(w.url!) : undefined}
                onTogglePriority={() => void togglePriority(w)}
                onDelete={() => void removeWish(w)}
              />
            )}
          />
        ) : loading ? (
          <View style={styles.skeletons}>
            <View style={{ flex: 1, gap: Space.md }}>
              <Skeleton style={{ height: 220, borderRadius: Radius.lg }} />
              <Skeleton style={{ height: 160, borderRadius: Radius.lg }} />
            </View>
            <View style={{ flex: 1, gap: Space.md }}>
              <Skeleton style={{ height: 170, borderRadius: Radius.lg }} />
              <Skeleton style={{ height: 230, borderRadius: Radius.lg }} />
            </View>
          </View>
        ) : error ? (
          <EmptyState icon={Icons.gift} title="Impossible de charger" message={error} action={<Button title="Réessayer" variant="outline" size="md" onPress={refresh} />} />
        ) : (
          <Pressable onPress={addHref} style={styles.addTile}>
            <View style={styles.addIcon}>
              <Icon name={Icons.plus} size={20} />
            </View>
            <Txt variant="callout">Ajouter un souhait</Txt>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.xs, paddingBottom: Space.xs, gap: Space.xs },
  navTitle: { flex: 1, fontSize: 18, lineHeight: 24 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  skeletons: { flexDirection: 'row', gap: Space.md },
  addTile: {
    height: 220,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.md,
  },
  addIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.text, alignItems: 'center', justifyContent: 'center' },
});
