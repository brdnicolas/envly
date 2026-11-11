import { Image } from "expo-image";
import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { CollectionMenu, type MenuItem } from "@/components/collection-menu";
import { Icon, Icons } from "@/components/icon";
import { IconButton, Txt } from "@/components/primitives";
import { Colors, Radius, Space } from "@/constants/theme";
import { thumb } from "@/lib/image";
import type { CollectionSummary } from "@/lib/types";

/** Web-style collection card: 3×2 photo grid, name, count and visibility. */
export function CollectionCard({
  collection,
  href,
  onPress,
  onShare,
  actions,
  subtitle,
  width,
}: {
  collection: CollectionSummary;
  href?: Href;
  onPress?: () => void;
  onShare?: () => void;
  /** Grouped actions: shown in the "…" pull-down and on long-press. */
  actions?: MenuItem[][];
  subtitle?: string;
  width?: number;
}) {
  const images = collection.wishes
    .map((w) => w.imageUrl)
    .filter((u): u is string => !!u)
    .slice(0, 6);
  const count = collection._count.wishes;
  const cells = Array.from({ length: 6 }, (_, i) => images[i] ?? null);

  const card = (
    <Pressable
      onPress={onPress}
      style={StyleSheet.flatten([styles.card, width ? { width } : null])}
    >
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
                  {uri && (
                    <Image
                      alt=""
                      source={thumb(uri, 360)}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={150}
                      recyclingKey={uri}
                    />
                  )}
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
          {onShare && (
            <IconButton
              icon={Icons.share}
              label="Partager"
              size={30}
              onPress={onShare}
            />
          )}
          {actions && <CollectionMenu groups={actions} size={32} />}
        </View>
        {/* One quiet line: count · visibility (no loud badges) */}
        <View style={styles.infoRow}>
          <Txt variant="footnote" color="text2">
            {subtitle ?? (count === 0 ? "Vide" : `${count} souhait${count > 1 ? "s" : ""}`)}
          </Txt>
          <Txt variant="footnote" color="text3">
            ·
          </Txt>
          <Icon
            name={collection.isPublic ? Icons.globe : Icons.lock}
            size={12}
            color={Colors.text3}
          />
          <Txt variant="footnote" color="text3">
            {collection.isPublic ? "Publique" : "Privée"}
          </Txt>
        </View>
      </View>
    </Pressable>
  );

  if (!href) return card;
  return (
    <Link href={href} asChild>
      <Link.Trigger>{card}</Link.Trigger>
      <Link.Preview />
      {actions && (
        <Link.Menu>
          {actions.flat().map((a) => (
            <Link.MenuAction
              key={a.label}
              title={a.label}
              icon={a.icon as never}
              destructive={a.destructive}
              onPress={a.onPress}
            />
          ))}
        </Link.Menu>
      )}
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  grid: { gap: 1, backgroundColor: Colors.border, aspectRatio: 3 / 2 },
  row: { flex: 1, flexDirection: "row", gap: 1 },
  cell: { flex: 1, backgroundColor: Colors.muted, overflow: "hidden" },
  emptyCover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.muted,
  },
  meta: {
    paddingHorizontal: Space.lg,
    paddingTop: Space.md,
    paddingBottom: Space.lg,
    gap: 6,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Space.xs },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
});
