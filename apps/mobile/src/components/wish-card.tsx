import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { Txt } from '@/components/primitives';
import { Colors, Radius, Space, Type } from '@/constants/theme';
import { formatPrice } from '@/lib/api';
import { domainOf } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { thumb } from '@/lib/image';
import type { Wish } from '@/lib/types';

export type CardAction = { title: string; icon: string; onPress: () => void; destructive?: boolean };

/**
 * Pinterest-style card: the photo keeps its natural ratio.
 * Tap → `onPress` (the product page) or, without it, `href`. Long-press → native menu of `actions`.
 */
export function WishCard({
  wish,
  href,
  onPress,
  actions,
  reserved,
  reservation,
}: {
  wish: Wish;
  href: Href;
  onPress?: () => void;
  actions: CardAction[];
  /** Friends' lists: someone already offers this gift. */
  reserved?: boolean;
  /** Friends' lists: a visible "Réserver" button (free) or "Réservé par vous" (mine). */
  reservation?: { state: 'free' | 'mine' | 'taken'; onReserve: () => void; onCancel: () => void };
}) {
  // Known size → the card has its final height immediately; otherwise measure on load (older wishes).
  const clamp = (r: number) => Math.min(Math.max(r, 0.6), 1.6);
  const stored = wish.imageWidth && wish.imageHeight ? clamp(wish.imageWidth / wish.imageHeight) : null;
  const [measured, setMeasured] = useState<number | null>(null);
  const ratio = stored ?? measured ?? 1;
  const price = formatPrice(wish.price);
  const domain = domainOf(wish.url);

  const card = (
    <Pressable style={StyleSheet.flatten([styles.card, reserved && { opacity: 0.55 }])}>
      {wish.imageUrl ? (
        <View style={{ aspectRatio: ratio, backgroundColor: '#FFFFFF' }}>
          <Image
            alt=""
            source={thumb(wish.imageUrl, 600)}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            recyclingKey={wish.id}
            onLoad={(e) => {
              const { width, height } = e.source;
              if (!stored && width && height) setMeasured(clamp(width / height));
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
        {reservation?.state === 'free' && (
          <Pressable
            onPress={() => {
              haptic.select();
              reservation.onReserve();
            }}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Réserver ${wish.title}`}
            style={({ pressed }) => [styles.reserveBtn, pressed && { opacity: 0.7 }]}>
            <Icon name={Icons.gift} size={13} color={GOLD} />
            <Txt variant="caption" style={{ color: GOLD }}>
              Réserver
            </Txt>
          </Pressable>
        )}
        {reservation?.state === 'mine' && (
          <View style={styles.mineRow}>
            <View style={styles.mine}>
              <Icon name={Icons.check} size={11} color={Colors.success} weight="semibold" />
              <Txt variant="micro" style={{ color: Colors.success }}>
                Réservé par vous
              </Txt>
            </View>
            <Pressable onPress={reservation.onCancel} hitSlop={8} accessibilityRole="button" accessibilityLabel="Annuler ma réservation">
              <Txt variant="micro" color="text3" style={{ textDecorationLine: 'underline' }}>
                Annuler
              </Txt>
            </Pressable>
          </View>
        )}
        {reserved && reservation?.state !== 'mine' && (
          <View style={styles.reserved}>
            <Icon name={Icons.check} size={11} color={Colors.text2} weight="semibold" />
            <Txt variant="micro" color="text2">
              Réservé
            </Txt>
          </View>
        )}
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
    <Link
      href={href}
      asChild
      onPress={(e) => {
        if (!onPress) return;
        e.preventDefault();
        onPress();
      }}>
      <Link.Trigger>{card}</Link.Trigger>
      {actions.length > 0 && (
        <Link.Menu>
          {actions.map((a) => (
            <Link.MenuAction key={a.title} title={a.title} icon={a.icon as never} destructive={a.destructive} onPress={a.onPress} />
          ))}
        </Link.Menu>
      )}
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

const GOLD = '#E8C872';

const styles = StyleSheet.create({
  reserveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(232,200,114,0.45)',
    backgroundColor: 'rgba(232,200,114,0.08)',
  },
  mineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  mine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  placeholder: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.muted },
  star: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: Colors.star,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { padding: Space.md, gap: 6 },
  reserved: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  masonry: { flexDirection: 'row', gap: Space.md, alignItems: 'flex-start' },
  column: { flex: 1, gap: Space.md },
});
