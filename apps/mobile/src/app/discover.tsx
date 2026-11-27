import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icons } from '@/components/icon';
import { NavBar } from '@/components/nav-bar';
import { Chip, EmptyState, Skeleton, Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { formatPrice } from '@/lib/api';
import { domainOf } from '@/lib/format';
import { thumb } from '@/lib/image';
import type { DiscoverFeed, DiscoverItem } from '@/lib/types';

const GAP = 10;

/** "Découvrir": products most added to public lists lately, by budget. One tap adds one to my lists. */
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [budget, setBudget] = useState<string | null>(null);
  const { data, error, refreshing, refresh } = useApi<DiscoverFeed>(`/api/discover${budget ? `?budget=${budget}` : ''}`);
  const tileWidth = (width - Space.lg * 2 - GAP) / 2;

  function open(item: DiscoverItem) {
    router.push({
      pathname: '/discover-add',
      params: {
        title: item.title,
        ...(item.url && { url: item.url }),
        ...(item.imageUrl && { imageUrl: item.imageUrl }),
        ...(item.price != null && { price: String(item.price) }),
      },
    });
  }

  const items = data?.items ?? [];
  const cols: DiscoverItem[][] = [[], []];
  const heights = [0, 0];
  for (const it of items) {
    const ratio = it.imageWidth && it.imageHeight ? Math.min(Math.max(it.imageWidth / it.imageHeight, 0.6), 1.6) : 1;
    const i = heights[0] <= heights[1] ? 0 : 1;
    cols[i].push(it);
    heights[i] += tileWidth / ratio + 70;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <NavBar title="Idées cadeaux" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + Space.x3, gap: Space.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text2} />}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Tout" selected={!budget} onPress={() => setBudget(null)} />
          {(data?.budgets ?? []).map((b) => (
            <Chip key={b.key} label={b.label} selected={budget === b.key} onPress={() => setBudget(b.key)} />
          ))}
        </ScrollView>

        {!data && !error ? (
          <View style={styles.masonry}>
            {[0, 1].map((c) => (
              <View key={c} style={{ width: tileWidth, gap: GAP }}>
                <Skeleton style={{ height: c ? 180 : 240, borderRadius: Radius.lg }} />
                <Skeleton style={{ height: c ? 240 : 180, borderRadius: Radius.lg }} />
              </View>
            ))}
          </View>
        ) : error ? (
          <EmptyState icon={Icons.sparkles} title="Impossible de charger" message={error} />
        ) : items.length === 0 ? (
          <EmptyState icon={Icons.sparkles} title="Rien pour l’instant" message="Revenez bientôt, de nouvelles idées arrivent chaque jour." />
        ) : (
          <View style={styles.masonry}>
            {cols.map((col, i) => (
              <View key={i} style={{ width: tileWidth, gap: GAP }}>
                {col.map((it) => (
                  <Tile key={it.id} item={it} width={tileWidth} onPress={() => open(it)} />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Tile({ item: it, width, onPress }: { item: DiscoverItem; width: number; onPress: () => void }) {
  const ratio = it.imageWidth && it.imageHeight ? Math.min(Math.max(it.imageWidth / it.imageHeight, 0.6), 1.6) : 1;
  const price = formatPrice(it.price);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
      {it.imageUrl && (
        <View style={{ width, height: width / ratio, backgroundColor: '#FFFFFF' }}>
          <Image source={thumb(it.imageUrl, 500)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} recyclingKey={it.id} alt="" />
          {it.popularity > 1 && (
            <View style={styles.popular}>
              <Txt variant="micro" style={{ color: '#FFFFFF' }}>
                🔥 {it.popularity} listes
              </Txt>
            </View>
          )}
        </View>
      )}
      <View style={styles.body}>
        <Txt variant="callout" numberOfLines={2}>
          {it.title}
        </Txt>
        <View style={styles.meta}>
          <Txt variant="micro" color="text3" numberOfLines={1} style={{ flex: 1 }}>
            {domainOf(it.url) ?? ''}
          </Txt>
          {price && <Txt variant="price">{price}</Txt>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: Space.lg, gap: Space.sm, paddingTop: Space.sm },
  masonry: { flexDirection: 'row', gap: GAP, paddingHorizontal: Space.lg },
  tile: { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  popular: { position: 'absolute', left: 8, bottom: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(10,10,10,0.72)' },
  body: { padding: Space.md, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
});
