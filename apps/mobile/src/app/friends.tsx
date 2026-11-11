import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { NavBar } from '@/components/nav-bar';
import { Avatar, Button, EmptyState, IconButton, Skeleton, Txt } from '@/components/primitives';
import { Colors, Fonts, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { formatPrice } from '@/lib/api';
import { firstName, timeAgo } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { thumb } from '@/lib/image';
import type { FeedWish, Friend, FriendsHome } from '@/lib/types';

const GOLD = '#E8C872';
const GAP = 10;

const openProfile = (p: { id: string; name: string | null; image: string | null }) => {
  haptic.select();
  router.push({ pathname: '/user/[id]', params: { id: p.id, name: p.name ?? '', image: p.image ?? '' } });
};
const openSearch = () => router.push('/friends-search');

/**
 * "Amis": who I follow (story-style row, a gold ring when they added something this week)
 * and a feed of what they wished for lately — the reason to come back here.
 */
export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, error, loading, refreshing, refresh } = useApi<FriendsHome>('/api/friends');
  const people = data?.people ?? [];
  const feed = data?.feed ?? [];
  const tileWidth = (width - Space.lg * 2 - GAP) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <NavBar title="Amis" right={<IconButton icon={Icons.personAdd} label="Trouver des amis" size={40} onPress={openSearch} />} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + Space.x3 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text2} />}>
        {loading ? (
          <LoadingState tileWidth={tileWidth} />
        ) : error ? (
          <EmptyState
            icon={Icons.people}
            title="Impossible de charger"
            message={error}
            action={<Button title="Réessayer" variant="outline" size="md" onPress={refresh} />}
          />
        ) : people.length === 0 ? (
          <NoFriends />
        ) : (
          <>
            {/* Who I follow */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
              <Pressable onPress={openSearch} style={styles.story} accessibilityRole="button" accessibilityLabel="Ajouter des amis">
                <View style={[styles.ring, styles.addRing]}>
                  <Icon name={Icons.plus} size={22} color={Colors.text2} />
                </View>
                <Txt variant="caption" color="text2" numberOfLines={1}>
                  Ajouter
                </Txt>
              </Pressable>
              {people.map((p) => (
                <StoryAvatar key={p.id} friend={p} />
              ))}
            </ScrollView>

            {/* Secret Santa */}
            <Pressable
              onPress={() => router.push('/santa/new')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.santa, pressed && { opacity: 0.8 }]}>
              <View style={styles.santaIcon}>
                <Icon name={Icons.gift} size={18} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyMedium">Organiser un Secret Santa</Txt>
                <Txt variant="footnote" color="text2">
                  Tirez au sort entre amis, chacun voit la liste de l’autre.
                </Txt>
              </View>
              <Icon name={Icons.chevronRight} size={13} color={Colors.text3} />
            </Pressable>

            {/* What they wished for lately */}
            <View style={styles.sectionHead}>
              <Txt variant="title2">Nouveautés</Txt>
              <Txt variant="footnote" color="text3">
                Les dernières envies de vos amis
              </Txt>
            </View>
            {feed.length === 0 ? (
              <Txt variant="subhead" color="text3" style={{ paddingHorizontal: Space.lg }}>
                Vos amis n’ont encore rien ajouté à leurs listes publiques.
              </Txt>
            ) : (
              <Masonry items={feed} tileWidth={tileWidth} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StoryAvatar({ friend: p }: { friend: Friend }) {
  return (
    <Pressable onPress={() => openProfile(p)} style={styles.story} accessibilityRole="button" accessibilityLabel={p.name ?? 'Ami'}>
      <View style={[styles.ring, p.hasNew ? styles.ringNew : styles.ringSeen]}>
        <Avatar uri={p.image} name={p.name} size={58} />
      </View>
      <Txt variant="caption" numberOfLines={1} color={p.hasNew ? 'text' : 'text2'}>
        {firstName(p.name) || 'Ami'}
      </Txt>
    </Pressable>
  );
}

/** Two columns, each tile goes to the shorter one (heights known up front from the stored photo sizes). */
function Masonry({ items, tileWidth }: { items: FeedWish[]; tileWidth: number }) {
  const cols: FeedWish[][] = [[], []];
  const heights = [0, 0];
  for (const w of items) {
    const ratio = w.imageWidth && w.imageHeight ? Math.min(Math.max(w.imageWidth / w.imageHeight, 0.6), 1.6) : 1;
    const h = (w.imageUrl ? tileWidth / ratio : 0) + 74;
    const i = heights[0] <= heights[1] ? 0 : 1;
    cols[i].push(w);
    heights[i] += h + GAP;
  }
  return (
    <View style={styles.masonry}>
      {cols.map((col, i) => (
        <View key={i} style={{ width: tileWidth, gap: GAP }}>
          {col.map((w) => (
            <FeedTile key={w.id} wish={w} width={tileWidth} />
          ))}
        </View>
      ))}
    </View>
  );
}

function FeedTile({ wish: w, width }: { wish: FeedWish; width: number }) {
  const ratio = w.imageWidth && w.imageHeight ? Math.min(Math.max(w.imageWidth / w.imageHeight, 0.6), 1.6) : 1;
  const price = formatPrice(w.price);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/collection/[id]', params: { id: w.collection.id, name: w.collection.name } })}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
      {w.imageUrl && (
        <View style={{ width, height: width / ratio, backgroundColor: '#FFFFFF' }}>
          <Image source={thumb(w.imageUrl, 500)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} recyclingKey={w.id} alt="" />
          {/* Who wished for it: tap goes to their profile */}
          <Pressable onPress={() => openProfile(w.owner)} hitSlop={6} style={styles.ownerChip}>
            <Avatar uri={w.owner.image} name={w.owner.name} size={20} />
            <Txt variant="micro" style={{ fontFamily: Fonts.medium, color: '#FFFFFF' }} numberOfLines={1}>
              {firstName(w.owner.name) || 'Ami'}
            </Txt>
          </Pressable>
        </View>
      )}
      <View style={styles.tileBody}>
        <Txt variant="callout" numberOfLines={2}>
          {w.title}
        </Txt>
        <View style={styles.tileMeta}>
          {price ? (
            <Txt variant="price">{price}</Txt>
          ) : (
            <Txt variant="micro" color="text3" numberOfLines={1} style={{ flex: 1 }}>
              {w.collection.name}
            </Txt>
          )}
          <Txt variant="micro" color="text3">
            {timeAgo(w.createdAt)}
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

function NoFriends() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyAvatars}>
        {['#F59E0B', '#EC4899', '#6366F1'].map((c, i) => (
          <View key={c} style={[styles.emptyBubble, { backgroundColor: c, marginLeft: i ? -14 : 0, zIndex: 3 - i }]} />
        ))}
      </View>
      <Txt variant="title2" center>
        Les envies de vos proches
      </Txt>
      <Txt variant="subhead" color="text2" center style={{ maxWidth: 300 }}>
        Suivez vos amis pour voir ce qu’ils ajoutent à leurs listes, et ne plus jamais vous demander quoi leur offrir.
      </Txt>
      <Button title="Trouver des amis" icon={Icons.search} size="md" onPress={openSearch} style={{ marginTop: Space.md }} />
    </View>
  );
}

function LoadingState({ tileWidth }: { tileWidth: number }) {
  return (
    <View style={{ gap: Space.xl }}>
      <View style={styles.stories}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.story}>
            <Skeleton style={{ width: 66, height: 66, borderRadius: 33 }} />
            <Skeleton style={{ width: 44, height: 10, borderRadius: 5 }} />
          </View>
        ))}
      </View>
      <View style={styles.masonry}>
        {[0, 1].map((c) => (
          <View key={c} style={{ width: tileWidth, gap: GAP }}>
            <Skeleton style={{ height: c ? 180 : 240, borderRadius: Radius.lg }} />
            <Skeleton style={{ height: c ? 240 : 180, borderRadius: Radius.lg }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stories: { paddingHorizontal: Space.lg, paddingTop: Space.sm, paddingBottom: Space.lg, gap: Space.lg, flexDirection: 'row' },
  story: { width: 66, alignItems: 'center', gap: 6 },
  ring: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  ringNew: { borderWidth: 2, borderColor: GOLD },
  ringSeen: { borderWidth: 1, borderColor: Colors.borderStrong },
  addRing: { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.text3 },
  santa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    marginHorizontal: Space.lg,
    padding: Space.md,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(232,200,114,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232,200,114,0.25)',
  },
  santaIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,200,114,0.12)' },
  sectionHead: { paddingHorizontal: Space.lg, paddingTop: Space.x3, paddingBottom: Space.md, gap: 2 },
  masonry: { flexDirection: 'row', gap: GAP, paddingHorizontal: Space.lg },
  tile: { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  ownerChip: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 2,
    paddingRight: 9,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(10,10,10,0.72)',
  },
  tileBody: { padding: Space.md, gap: 6 },
  tileMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  empty: { alignItems: 'center', gap: Space.md, paddingHorizontal: Space.xl, paddingTop: Space.x4 * 2 },
  emptyAvatars: { flexDirection: 'row', marginBottom: Space.md },
  emptyBubble: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: Colors.bg },
});
