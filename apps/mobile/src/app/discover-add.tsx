import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { Button, Txt } from '@/components/primitives';
import { Sheet, useSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { Colors, Radius, Space } from '@/constants/theme';
import { invalidate, useApi } from '@/hooks/use-api';
import { openProduct } from '@/lib/actions';
import { api, errorMessage, formatPrice } from '@/lib/api';
import { domainOf, splitEmoji } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { thumb } from '@/lib/image';
import type { CollectionSummary } from '@/lib/types';

/** Bottom sheet from "Découvrir": product preview, open it, or add it to one of my lists. */
function DiscoverAddContent() {
  const toast = useToast();
  const { close } = useSheet();
  const p = useLocalSearchParams<{ title: string; url?: string; imageUrl?: string; price?: string }>();
  const { data: collections } = useApi<CollectionSummary[]>('/api/collections');
  const [saving, setSaving] = useState<string | null>(null);
  const mine = (collections ?? []).filter((c) => c.role !== 'collaborator');
  const price = p.price ? formatPrice(Number(p.price)) : null;

  async function add(c: CollectionSummary) {
    setSaving(c.id);
    try {
      await api('/api/wishes', {
        method: 'POST',
        body: { title: p.title, url: p.url || null, imageUrl: p.imageUrl || null, price: p.price ? Number(p.price) : null, collectionId: c.id },
      });
      invalidate('/api/collections');
      haptic.success();
      toast(`Ajouté à « ${c.name} »`);
      close();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
      setSaving(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.product}>
        <View style={styles.photo}>
          {p.imageUrl ? <Image source={thumb(p.imageUrl, 300)} style={StyleSheet.absoluteFill} contentFit="cover" alt="" /> : null}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="bodyMedium" numberOfLines={3}>
            {p.title}
          </Txt>
          <Txt variant="footnote" color="text3" numberOfLines={1}>
            {[domainOf(p.url), price].filter(Boolean).join(' · ')}
          </Txt>
        </View>
      </View>

      {!!p.url && <Button title="Voir le produit" variant="outline" iconRight={Icons.arrowUpRight} onPress={() => openProduct(p.url!)} />}

      <Txt variant="headline">Ajouter à une liste</Txt>
      <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: Space.sm }}>
        {mine.map((c) => {
          const { emoji, label } = splitEmoji(c.name);
          return (
            <Pressable
              key={c.id}
              disabled={!!saving}
              onPress={() => void add(c)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.elevated }]}>
              <View style={styles.badge}>
                {emoji ? <Txt style={{ fontSize: 18 }}>{emoji}</Txt> : <Icon name={Icons.gift} size={16} color={Colors.text2} />}
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyMedium" numberOfLines={1}>
                  {label}
                </Txt>
                <Txt variant="footnote" color="text3">
                  {c._count.wishes} envie{c._count.wishes > 1 ? 's' : ''}
                </Txt>
              </View>
              {saving === c.id ? <ActivityIndicator color={Colors.text2} /> : <Icon name={Icons.plus} size={16} color={Colors.text2} />}
            </Pressable>
          );
        })}
        {collections && mine.length === 0 && (
          <Txt variant="footnote" color="text3">
            Créez d’abord une liste depuis l’accueil.
          </Txt>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Space.xl, paddingTop: Space.sm, paddingBottom: Space.md, gap: Space.lg },
  product: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  photo: { width: 72, height: 72, borderRadius: Radius.md, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.muted },
});

export default function DiscoverAddScreen() {
  return (
    <Sheet>
      <DiscoverAddContent />
    </Sheet>
  );
}
