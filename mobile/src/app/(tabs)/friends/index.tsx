import { useScrollToTop } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionCard } from '@/components/collection-card';
import { Icons } from '@/components/icon';
import { Avatar, Button, Divider, EmptyState, Skeleton, Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { API_URL, publicCollectionUrl } from '@/lib/api';
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

  const listRef = useRef<FlatList<Group>>(null);
  useScrollToTop(listRef);

  const groups: Group[] = [];
  for (const c of data ?? []) {
    const g = groups.find((x) => x.owner.id === c.owner.id);
    if (g) g.lists.push(c);
    else groups.push({ owner: c.owner, lists: [c] });
  }

  return (
    <FlatList
      ref={listRef}
      style={{ backgroundColor: Colors.bg }}
      data={groups}
      keyExtractor={(g) => g.owner.id}
      contentContainerStyle={{ paddingTop: insets.top + Space.sm, paddingBottom: Space.x3 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text2} />}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <Txt variant="title">Amis</Txt>
            <Button title="Trouver des amis" size="sm" variant="outline" onPress={() => void openWeb(`${API_URL}/friends`)} />
          </View>
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
            {item.owner.slug && (
              <Button title="Profil" size="sm" variant="secondary" onPress={() => void openWeb(`${API_URL}/u/${item.owner.slug}`)} />
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Space.lg, gap: Space.md }}>
            {item.lists.map((c) => (
              <CollectionCard key={c.id} collection={c} width={270} onPress={() => void openWeb(publicCollectionUrl(c.slug))} />
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
          <EmptyState icon={Icons.people} title="Impossible de charger" message={error} action={<Button title="Réessayer" variant="outline" size="md" onPress={refresh} />} />
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
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.lg, paddingBottom: Space.md },
  owner: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.lg },
});
