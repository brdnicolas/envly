import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { BOTTOM_ACTION_SPACE, BottomAction, useScrollReveal } from '@/components/bottom-action';
import { CollectionMenu, collectionActions, editCollection } from '@/components/collection-menu';
import { NavBar } from '@/components/nav-bar';
import { blockUser, reportUser } from '@/lib/social';
import { firstName } from '@/lib/format';
import { Avatar, Badge, Button, EmptyState, Skeleton, Txt } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { Masonry, WishCard, type CardAction } from '@/components/wish-card';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { confirm, deleteCollection, deleteWish, openProduct, setCollectionPublic, shareCollection, updateWish } from '@/lib/actions';
import { errorMessage, publicCollectionUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';
import { cancelReservation, reserveWish, useMyReservations } from '@/lib/reservations';
import type { CollectionDetail, Wish } from '@/lib/types';

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const reveal = useScrollReveal();
  const toast = useToast();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { data, error, loading, refreshing, refresh, mutate } = useApi<CollectionDetail>(`/api/collections/${id}`);

  const { user } = useAuth();
  const myReservations = useMyReservations();
  const isOwner = data?.role === 'owner';
  const isViewer = data?.role === 'viewer';
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

  async function reserve(w: Wish) {
    if (!data) return;
    const owner = data.user.name ?? 'Le propriétaire';
    const ok = await confirm('Réserver ce cadeau ?', `Les autres verront qu'il est pris. ${owner} ne le saura pas.`, 'Réserver', false);
    if (!ok) return;
    try {
      await reserveWish(w.id, user?.name ?? 'Un ami');
      mutate({ ...data, wishes: data.wishes.map((x) => (x.id === w.id ? { ...x, reservation: { reservedBy: user?.name ?? '' } } : x)) });
      toast('Cadeau réservé');
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  async function unreserve(w: Wish) {
    if (!data) return;
    const ok = await confirm('Annuler votre réservation ?', `« ${w.title} » redeviendra disponible pour les autres.`, 'Annuler la réservation', true, 'Garder');
    if (!ok) return;
    try {
      await cancelReservation(w.id);
      mutate({ ...data, wishes: data.wishes.map((x) => (x.id === w.id ? { ...x, reservation: null } : x)) });
      toast('Réservation annulée');
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  const detail = (w: Wish, edit?: boolean) => router.push({ pathname: '/wish/[id]', params: { id: w.id, collectionId: id, ...(edit && { edit: '1' }) } });

  function cardActions(w: Wish): CardAction[] {
    if (isViewer) {
      const mine = !!myReservations[w.id];
      return [
        ...(w.url ? [{ title: 'Voir le produit', icon: 'arrow.up.right', onPress: () => openProduct(w.url!) }] : []),
        { title: 'Détails', icon: 'info.circle', onPress: () => detail(w) },
        ...(mine
          ? [{ title: 'Annuler ma réservation', icon: 'xmark.circle', onPress: () => void unreserve(w) }]
          : !w.reservation
            ? [{ title: 'Réserver ce cadeau', icon: 'gift', onPress: () => void reserve(w) }]
            : []),
      ];
    }
    return [
      { title: 'Modifier', icon: 'pencil', onPress: () => detail(w, true) },
      {
        title: w.isPriority ? 'Retirer des favoris' : 'Ajouter aux favoris',
        icon: w.isPriority ? 'star.slash' : 'star',
        onPress: () => void togglePriority(w),
      },
      { title: 'Supprimer', icon: 'trash', destructive: true, onPress: () => void removeWish(w) },
    ];
  }



  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <NavBar
        title={data?.name ?? name}
        right={
          data ? (
            <CollectionMenu
              groups={[
                ...collectionActions(data, isOwner, {
                  edit: () => editCollection(data),
                  share: () => void share(),
                  copyLink: () => void copyLink(),
                  togglePublic: () => void togglePublic(),
                  remove: () => void removeList(),
                }),
                // Someone else's list (App Store guideline 1.2: report + block).
                isViewer
                  ? [
                      {
                        label: 'Signaler cette liste',
                        icon: 'flag',
                        onPress: () => reportUser({ userId: data.user.id, name: data.user.name, collectionId: data.id }, () => router.back()),
                      },
                      {
                        label: `Bloquer ${firstName(data.user.name) || 'cette personne'}`,
                        icon: 'hand.raised',
                        destructive: true,
                        onPress: () => void blockUser({ userId: data.user.id, name: data.user.name }).then((ok) => ok && router.back()),
                      },
                    ]
                  : [],
              ]}
            />
          ) : undefined
        }
      />
      <ScrollView
        style={{ backgroundColor: Colors.bg }}
        contentContainerStyle={{
          paddingHorizontal: Space.lg,
          paddingBottom: insets.bottom + (isViewer ? Space.x3 : BOTTOM_ACTION_SPACE + Space.xl),
          gap: Space.lg,
        }}
        onScroll={reveal.onScroll}
        scrollEventThrottle={32}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text2} />}>
        {data ? (
          <View style={{ gap: Space.md }}>
            {!!data.description && (
              <Txt variant="subhead" color="text2">
                {data.description}
              </Txt>
            )}
            <View style={styles.actions}>
              {isViewer ? (
                <Pressable
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Profil de ${data.user.name ?? 'cet ami'}`}
                  onPress={() =>
                    router.push({ pathname: '/user/[id]', params: { id: data.user.id, name: data.user.name ?? '', image: data.user.image ?? '' } })
                  }>
                  <Avatar uri={data.user.image} name={data.user.name} size={28} />
                </Pressable>
              ) : (
                <Avatar uri={data.user.image} name={data.user.name} size={28} />
              )}
              {isViewer ? null : isOwner ? (
                <Pressable
                  onPress={togglePublic}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={data.isPublic ? 'Rendre privée' : 'Rendre publique'}>
                  {data.isPublic ? <Badge label="Publique" tone="success" icon={Icons.globe} /> : <Badge label="Privée" icon={Icons.lock} />}
                </Pressable>
              ) : data.isPublic ? (
                <Badge label="Publique" tone="success" icon={Icons.globe} />
              ) : (
                <Badge label="Privée" icon={Icons.lock} />
              )}
              <Txt variant="footnote" color="text3" numberOfLines={1} style={{ flex: 1 }}>
                {isViewer ? `${data.user.name ?? 'Un ami'} · ` : ''}
                {wishes.length} souhait{wishes.length > 1 ? 's' : ''}
              </Txt>
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
                onPress={w.url ? () => openProduct(w.url!) : undefined}
                actions={cardActions(w)}
                reserved={isViewer && !!w.reservation && !myReservations[w.id]}
                reservation={
                  isViewer
                    ? {
                        state: myReservations[w.id] ? 'mine' : w.reservation ? 'taken' : 'free',
                        onReserve: () => void reserve(w),
                        onCancel: () => void unreserve(w),
                      }
                    : undefined
                }
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
          <EmptyState
            icon={Icons.gift}
            title="Impossible de charger"
            message={error}
            action={<Button title="Réessayer" variant="outline" size="md" onPress={refresh} />}
          />
        ) : isViewer ? (
          <EmptyState icon={Icons.gift} title="Liste vide" message="Rien ici pour l'instant." />
        ) : (
          <Pressable onPress={addHref} style={styles.addTile}>
            <View style={styles.addIcon}>
              <Icon name={Icons.plus} size={20} />
            </View>
            <Txt variant="callout">Ajouter un souhait</Txt>
          </Pressable>
        )}
      </ScrollView>
      {data && !isViewer && <BottomAction title="Ajouter" visible={reveal.visible} onPress={addHref} />}
    </View>
  );
}

const styles = StyleSheet.create({
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
