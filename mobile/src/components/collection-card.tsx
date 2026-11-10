import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { Badge, IconButton, Txt } from '@/components/primitives';
import { Colors, Radius, Space } from '@/constants/theme';
import type { CollectionSummary } from '@/lib/types';

type Menu = { onShare?: () => void; onTogglePublic?: () => void; onDelete?: () => void };

/** Web-style collection card: 3×2 photo grid, name, count and visibility. */
export function CollectionCard({
  collection,
  href,
  onPress,
  onShare,
  onMore,
  subtitle,
  width,
  menu,
}: {
  collection: CollectionSummary;
  href?: Href;
  onPress?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  subtitle?: string;
  width?: number;
  menu?: Menu;
}) {
  const images = collection.wishes.map((w) => w.imageUrl).filter((u): u is string => !!u).slice(0, 6);
  const count = collection._count.wishes;
  const cells = Array.from({ length: 6 }, (_, i) => images[i] ?? null);

  const card = (
    <Pressable onPress={onPress} style={StyleSheet.flatten([styles.card, width ? { width } : null])}>
      <View style={styles.grid}>
        {images.length === 0 ? (
          <View style={styles.emptyCover}>
            <Icon name={Icons.gift} size={26} color={Colors.text3} />
          </View>
        ) : (
          [0, 1].map((row) => (
            <View key={row} style={styles.row}>
              {cells.slice(row * 3, row * 3 + 3).map((uri, i) => (
                <View key={i} style={styles.cell}>
                  {uri && <Image alt="" source={uri} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={uri} />}
                </View>
              ))}
            </View>
          ))
        )}
      </View>
      <View style={styles.meta}>
        <View style={styles.titleRow}>
          <Txt variant="headline" numberOfLines={1} style={{ flex: 1 }}>
            {collection.name}
          </Txt>
          {onShare && <IconButton icon={Icons.share} label="Partager" size={30} onPress={onShare} />}
          {onMore && <IconButton icon={Icons.more} label="Options" size={30} onPress={onMore} />}
        </View>
        <View style={styles.infoRow}>
          <Txt variant="footnote" color="text2">
            {subtitle ?? `${count} souhait${count > 1 ? 's' : ''}`}
          </Txt>
          {collection.isPublic ? <Badge label="Publique" tone="light" /> : <Badge label="Privée" icon={Icons.lock} />}
        </View>
      </View>
    </Pressable>
  );

  if (!href) return card;
  return (
    <Link href={href} asChild>
      <Link.Trigger>{card}</Link.Trigger>
      <Link.Preview />
      {menu && (
        <Link.Menu>
          {menu.onShare && <Link.MenuAction title="Partager" icon="square.and.arrow.up" onPress={menu.onShare} />}
          {menu.onTogglePublic && (
            <Link.MenuAction
              title={collection.isPublic ? 'Rendre privée' : 'Rendre publique'}
              icon={collection.isPublic ? 'lock' : 'globe'}
              onPress={menu.onTogglePublic}
            />
          )}
          {menu.onDelete && <Link.MenuAction title="Supprimer" icon="trash" destructive onPress={menu.onDelete} />}
        </Link.Menu>
      )}
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  grid: { gap: 1, backgroundColor: Colors.border, aspectRatio: 3 / 2 },
  row: { flex: 1, flexDirection: 'row', gap: 1 },
  cell: { flex: 1, backgroundColor: Colors.muted, overflow: 'hidden' },
  emptyCover: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.muted },
  meta: { paddingHorizontal: Space.lg, paddingTop: Space.md, paddingBottom: Space.lg, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
});
