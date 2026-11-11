import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { Button, Skeleton, Txt } from '@/components/primitives';
import { Sheet, useSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { Colors, Fonts, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage, formatPrice } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { thumb } from '@/lib/image';
import { importWishes } from '@/lib/santa';
import type { MyWish, Santa } from '@/lib/types';

const GOLD = '#E8C872';
const COLS = 3;

/** Bottom sheet: pick wishes from my other lists into my Secret Santa list (in-budget ones first). */
function ImportContent() {
  const toast = useToast();
  const { close } = useSheet();
  const { width } = useWindowDimensions();
  const { id, listId } = useLocalSearchParams<{ id: string; listId: string }>();
  const { data: santa } = useApi<Santa>(`/api/santas/${id}`);
  const { data: wishes } = useApi<MyWish[]>('/api/wishes');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const budget = santa?.budget ?? null;
  const candidates = (wishes ?? []).filter((w) => w.collectionId !== listId);
  const fits = (w: MyWish) => !budget || w.price == null || w.price <= budget;
  const inBudget = candidates.filter(fits);
  const over = candidates.filter((w) => !fits(w));
  const size = Math.floor((width - Space.lg * 2 - Space.sm * (COLS - 1)) / COLS) - 1;

  function toggle(wid: string) {
    haptic.select();
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(wid)) next.delete(wid);
      else next.add(wid);
      return next;
    });
  }

  async function add() {
    if (!picked.size) return close();
    setSaving(true);
    try {
      const { imported } = await importWishes(listId, [...picked]);
      haptic.success();
      toast(`${imported} vœu${imported > 1 ? 'x' : ''} ajouté${imported > 1 ? 's' : ''}`);
      close();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
      setSaving(false);
    }
  }

  const grid = (items: MyWish[], dim?: boolean) => (
    <View style={styles.grid}>
      {items.map((w) => {
        const on = picked.has(w.id);
        return (
          <Pressable key={w.id} onPress={() => toggle(w.id)} style={[{ width: size, gap: 4 }, dim && !on && { opacity: 0.5 }]}>
            <View style={[styles.tileImage, { height: size }, on && styles.tileOn]}>
              {w.imageUrl ? (
                <Image source={{ uri: thumb(w.imageUrl, 300) }} style={{ width: size - 4, height: size - 4 }} contentFit="cover" />
              ) : (
                <Icon name={Icons.photo} size={20} color={Colors.text3} />
              )}
              <View style={[styles.check, on && styles.checkOn]}>{on && <Icon name={Icons.check} size={11} color={Colors.bg} weight="bold" />}</View>
            </View>
            <Txt variant="micro" numberOfLines={1} style={{ fontFamily: Fonts.medium, color: Colors.text }}>
              {w.title}
            </Txt>
            <Txt variant="micro" color="text3" numberOfLines={1}>
              {formatPrice(w.price) ?? w.collection.name}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={{ flexShrink: 1 }}>
      <View style={styles.head}>
        <Txt variant="title2">Ajouter des vœux</Txt>
        <Txt variant="footnote" color="text2">
          {budget ? `Vos idées à moins de ${budget} € d’abord.` : 'Piochez dans vos autres listes.'}
        </Txt>
      </View>
      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: Space.lg, paddingBottom: Space.lg, gap: Space.md }}>
        {!wishes ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} style={{ width: size, height: size, borderRadius: Radius.md }} />
            ))}
          </View>
        ) : candidates.length === 0 ? (
          <Txt color="text3" style={{ paddingVertical: Space.xl }}>
            Vous n’avez pas encore d’autres vœux. Ajoutez-en depuis votre liste.
          </Txt>
        ) : (
          <>
            {grid(inBudget)}
            {over.length > 0 && (
              <Txt variant="footnote" color="text3" style={{ paddingTop: Space.sm }}>
                Au-dessus de {budget}
                {' '}€
              </Txt>
            )}
            {over.length > 0 && grid(over, true)}
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={picked.size ? `Ajouter ${picked.size} vœu${picked.size > 1 ? 'x' : ''}` : 'Plus tard'}
          variant={picked.size ? 'primary' : 'secondary'}
          onPress={add}
          loading={saving}
        />
      </View>
    </View>
  );
}

export default function ImportSheet() {
  return (
    <Sheet maxHeight="88%">
      <ImportContent />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: Space.lg, paddingTop: Space.sm, paddingBottom: Space.md, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, rowGap: Space.md },
  tileImage: { borderRadius: Radius.md, overflow: 'hidden', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  tileOn: { borderColor: GOLD },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: GOLD, borderColor: GOLD },
  footer: { paddingHorizontal: Space.lg, paddingTop: Space.md },
});
