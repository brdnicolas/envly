import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { Txt } from '@/components/primitives';
import { Colors, Fonts, Radius, Space, Type } from '@/constants/theme';
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
  received,
  reservation,
}: {
  wish: Wish;
  href: Href;
  onPress?: () => void;
  actions: CardAction[];
  /** Friends' lists: someone already offers this gift. */
  reserved?: boolean;
  /** The owner marked it as received. */
  received?: boolean;
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
        {(domain || price) && (
          <View style={styles.meta}>
            <Txt variant="micro" color="text3" numberOfLines={1} style={{ flex: 1 }}>
              {domain ?? ''}
            </Txt>
            {price && <Txt style={[Type.price, { color: Colors.text }]}>{price}</Txt>}
          </View>
        )}

        {reservation?.state === 'free' && (
          <Pressable
            onPress={() => {
              haptic.select();
              reservation.onReserve();
            }}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Réserver ${wish.title}`}
            style={({ pressed }) => [styles.offer, pressed && { opacity: 0.75 }]}>
            <Icon name={Icons.gift} size={12} color={Colors.onPrimary} weight="semibold" />
            <Txt variant="caption" style={styles.offerLabel}>
              Réserver
            </Txt>
          </Pressable>
        )}

        {reservation?.state === 'mine' && (
          <View style={styles.status}>
            <Icon name={Icons.check} size={11} color={Colors.success} weight="semibold" />
            <Txt variant="micro" style={{ color: Colors.success, flex: 1 }}>
              Réservé par vous
            </Txt>
            <Pressable onPress={reservation.onCancel} hitSlop={8} accessibilityRole="button" accessibilityLabel="Annuler ma réservation">
              <Txt variant="micro" color="text3">
                Annuler
              </Txt>
            </Pressable>
          </View>
        )}

        {(received || reserved) && reservation?.state !== 'mine' && (
          <View style={styles.status}>
            <Icon name={received ? Icons.gift : Icons.check} size={11} color={Colors.text3} weight="semibold" />
            <Txt variant="micro" color="text3">
              {received ? (reservation ? 'Déjà offert' : 'Reçu') : 'Déjà réservé'}
            </Txt>
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


const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  offer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  offerLabel: { color: Colors.onPrimary, fontFamily: Fonts.semibold },
  status: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 4 },
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
  masonry: { flexDirection: 'row', gap: Space.md, alignItems: 'flex-start' },
  column: { flex: 1, gap: Space.md },
});
