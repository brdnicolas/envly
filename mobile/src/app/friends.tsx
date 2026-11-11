import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionCard } from '@/components/collection-card';
import { Icon, Icons } from '@/components/icon';
import { NavBar } from '@/components/nav-bar';
import { Avatar, Button, Divider, EmptyState, Skeleton, Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { API_URL } from '@/lib/api';
import type { FriendCollection } from '@/lib/types';

type Group = { owner: FriendCollection['owner']; lists: FriendCollection[] };

const openWeb = (url: string) =>
  WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: Colors.bg,
    controlsColor: Colors.text,
  });

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { data, error, loading, refreshing, refresh } = useApi<FriendCollection[]>('/api/follows/me?tab=friends-collections');

  const groups: Group[] = [];
  for (const c of data ?? []) {
    const g = groups.find((x) => x.owner.id === c.owner.id);
    if (g) g.lists.push(c);
    else groups.push({ owner: c.owner, lists: [c] });
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <NavBar
        title="Amis"
        right={<Button title="Trouver" size="sm" variant="secondary" style={{ marginRight: Space.sm }} onPress={() => void openWeb(`${API_URL}/friends`)} />}
      />
      <FlatList
        style={{ backgroundColor: Colors.bg }}
        data={groups}
        keyExtractor={(g) => g.owner.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + Space.x3 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text2} />}
        ListHeaderComponent={
          <View>
            <Divider />
            <Pressable
              onPress={() => router.push('/santa/new')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.santaRow, pressed && { backgroundColor: Colors.card }]}>
              <View style={styles.santaIcon}>
                <Icon name={Icons.gift} size={18} color="#E8C872" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyMedium">Organiser un Secret Santa</Txt>
                <Txt variant="footnote" color="text2">
                  Tirage au sort, listes partagées, surprise garantie.
                </Txt>
              </View>
              <Icon name={Icons.chevronRight} size={13} color={Colors.text3} />
            </Pressable>
            <Divider />
          </View>
        }
        ItemSeparatorComponent={() => <Divider style={{ marginHorizontal: Space.lg }} />}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: Space.xl, gap: Space.lg }}>
            <View style={styles.owner}>
              <Avatar uri={item.owner.image} name={item.owner.name} size={40} />
              <View style={{ flex: 1 }}>
                <Txt variant="headline">{item.owner.name ?? 'Utilisateur'}</Txt>
                <Txt variant="footnote" color="text2">
                  {item.lists.length} collection{item.lists.length > 1 ? 's' : ''}
                </Txt>
              </View>
              {item.owner.slug && <Button title="Profil" size="sm" variant="secondary" onPress={() => void openWeb(`${API_URL}/u/${item.owner.slug}`)} />}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Space.lg, gap: Space.md }}>
              {item.lists.map((c) => (
                <CollectionCard
                  key={c.id}
                  collection={c}
                  width={270}
                  onPress={() => router.push({ pathname: '/collection/[id]', params: { id: c.id, name: c.name } })}
                />
              ))}
            </ScrollView>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: Space.lg, gap: Space.lg }}>
              <Skeleton style={{ height: 40, width: 200, borderRadius: Radius.pill }} />
              <Skeleton style={{ height: 240, borderRadius: Radius.xl }} />
            </View>
          ) : error ? (
            <EmptyState
              icon={Icons.people}
              title="Impossible de charger"
              message={error}
              action={<Button title="Réessayer" variant="outline" size="md" onPress={refresh} />}
            />
          ) : (
            <EmptyState
              icon={Icons.people}
              title="Aucun ami pour l'instant"
              message="Suivez vos proches pour voir leurs collections publiques ici."
              action={<Button title="Trouver des amis" size="md" onPress={() => void openWeb(`${API_URL}/friends`)} />}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  santaRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.lg, paddingVertical: Space.md },
  santaIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,200,114,0.12)',
  },
  owner: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.lg },
});
