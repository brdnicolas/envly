import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { Txt } from '@/components/primitives';
import { Colors, Radius, Space, Type } from '@/constants/theme';
import { formatPrice } from '@/lib/api';
import { domainOf } from '@/lib/format';
import type { Wish } from '@/lib/types';

/** Pinterest-style card: the photo keeps its natural ratio. */
export function WishCard({
  wish,
  href,
  onOpenProduct,
  onTogglePriority,
  onDelete,
}: {
  wish: Wish;
  href: Href;
  onOpenProduct?: () => void;
  onTogglePriority?: () => void;
  onDelete?: () => void;
}) {
  const [ratio, setRatio] = useState(1);
  const price = formatPrice(wish.price);
  const domain = domainOf(wish.url);

  const card = (
    <Pressable style={styles.card}>
      {wish.imageUrl ? (
        <View style={{ aspectRatio: ratio, backgroundColor: '#FFFFFF' }}>
          <Image
            alt=""
            source={wish.imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            recyclingKey={wish.id}
            onLoad={(e) => {
              const { width, height } = e.source;
              if (width && height) setRatio(Math.min(Math.max(width / height, 0.6), 1.6));
            }}
          />
          {wish.isPriority && (
            <View style={styles.star}>
              <Icon name={Icons.starFill} size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Icon name={Icons.photo} size={22} color={Colors.text3} />
        </View>
      )}
      <View style={styles.info}>
        <Txt variant="callout" numberOfLines={2} style={{ fontSize: 13, lineHeight: 17 }}>
          {wish.title}
        </Txt>
        {(domain || price) && (
          <View style={styles.bottom}>
            <Txt variant="micro" color="text3" numberOfLines={1} style={{ flex: 1 }}>
              {domain ?? ''}
            </Txt>
            {price && <Txt style={[Type.price, { color: Colors.text }]}>{price}</Txt>}
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <Link href={href} asChild>
      <Link.Trigger>{card}</Link.Trigger>
      <Link.Menu>
        {onOpenProduct && <Link.MenuAction title="Voir le produit" icon="arrow.up.right" onPress={onOpenProduct} />}
        {onTogglePriority && (
          <Link.MenuAction
            title={wish.isPriority ? 'Retirer des prioritaires' : 'Marquer prioritaire'}
            icon={wish.isPriority ? 'star.slash' : 'star'}
            onPress={onTogglePriority}
          />
        )}
        {onDelete && <Link.MenuAction title="Supprimer" icon="trash" destructive onPress={onDelete} />}
      </Link.Menu>
    </Link>
  );
}

/** Two-column masonry. */
export function Masonry<T extends { id: string }>({ items, render }: { items: T[]; render: (item: T) => React.ReactNode }) {
  const cols: T[][] = [[], []];
  items.forEach((it, i) => cols[i % 2].push(it));
  return (
    <View style={styles.masonry}>
      {cols.map((col, c) => (
        <View key={c} style={styles.column}>
          {col.map((it) => (
            <View key={it.id}>{render(it)}</View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  placeholder: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.muted },
  star: { position: 'absolute', top: 8, left: 8, width: 26, height: 26, borderRadius: 9, backgroundColor: Colors.star, alignItems: 'center', justifyContent: 'center' },
  info: { padding: Space.md, gap: 6 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  masonry: { flexDirection: 'row', gap: Space.md, alignItems: 'flex-start' },
  column: { flex: 1, gap: Space.md },
});
