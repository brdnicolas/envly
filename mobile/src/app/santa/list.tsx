import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionPicker } from '@/components/collection-picker';
import { Icon, Icons } from '@/components/icon';
import { Button, IconButton, Skeleton, Txt } from '@/components/primitives';
import { SantaEyebrow } from '@/components/santa';
import { useToast } from '@/components/toast';
import { Colors, Fonts, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage, formatPrice } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { thumb } from '@/lib/image';
import { createSantaList, importWishes, joinSanta } from '@/lib/santa';
import type { CollectionSummary, MyWish, Santa } from '@/lib/types';

const GOLD = '#E8C872';

/**
 * "Your list for this Secret Santa": create a dedicated private list and fill it
 * with wishes from your other lists (budget-friendly ones first), or reuse a list.
 * `importTo` skips the intro and imports straight into that list.
 */
export default function SantaListScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { id, importTo } = useLocalSearchParams<{ id: string; welcome?: string; importTo?: string }>();
  const { data: santa } = useApi<Santa>(`/api/santas/${id}`);
  const { data: collections } = useApi<CollectionSummary[]>('/api/collections');
  const [listId, setListId] = useState<string | null>(importTo ?? null);
  const [busy, setBusy] = useState(false);

  const done = () => router.replace({ pathname: '/santa/[id]', params: { id } });

  async function createList() {
    setBusy(true);
    try {
      const { collection } = await createSantaList(id);
      haptic.success();
      setListId(collection.id);
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function shareExisting(cid: string) {
    try {
      await joinSanta(id, cid);
      haptic.success();
      toast('Liste partagée');
      done();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.top, { paddingTop: insets.top + Space.xs }]}>
        <IconButton icon={Icons.close} label="Fermer" onPress={done} />
      </View>
      {listId ? (
        <ImportPicker listId={listId} budget={santa?.budget ?? null} onDone={done} />
      ) : (
        <ScrollView contentContainerStyle={[styles.intro, { paddingBottom: insets.bottom + Space.xl }]}>
          <Animated.View entering={FadeInDown.duration(320)} style={{ gap: Space.sm }}>
            <SantaEyebrow label={santa?.name ?? 'Secret Santa'} />
            <Txt style={styles.title}>Et vous, qu’est-ce qui vous ferait plaisir ?</Txt>
            <Txt variant="body" color="text2">
              Créez une liste rien que pour ce Secret Santa. Seule la personne qui vous tirera au sort pourra la voir.
            </Txt>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.hero}>
            <View style={styles.heroIcon}>
              <Icon name={Icons.gift} size={28} color={GOLD} />
            </View>
            <View style={{ gap: 6 }}>
              <Txt variant="headline">Ma liste Secret Santa</Txt>
              <Txt variant="footnote" color="text2">
                Privée · vous pourrez y importer des vœux de vos autres listes
                {santa?.budget ? `, en commençant par ceux à moins de ${santa.budget}\u00a0€` : ''}.
              </Txt>
            </View>
            <Button title="Créer ma liste" onPress={createList} loading={busy} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(320)} style={{ gap: Space.sm }}>
            <Txt variant="footnote" color="text3" style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Ou utiliser une liste existante
            </Txt>
            <CollectionPicker collections={collections} value={santa?.me?.collection?.id ?? ''} onChange={(cid) => void shareExisting(cid)} />
          </Animated.View>

          <Pressable onPress={done} hitSlop={8} style={{ alignSelf: 'center', padding: Space.sm }}>
            <Txt variant="callout" color="text2">
              Plus tard
            </Txt>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function ImportPicker({ listId, budget, onDone }: { listId: string; budget: number | null; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { data: wishes } = useApi<MyWish[]>('/api/wishes');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const candidates = (wishes ?? []).filter((w) => w.collectionId !== listId);
  const fits = (w: MyWish) => !budget || w.price == null || w.price <= budget;
  const inBudget = candidates.filter(fits);
  const over = candidates.filter((w) => !fits(w));
  const size = (width - Space.xl * 2 - Space.md) / 2;

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
    if (!picked.size) return onDone();
    setSaving(true);
    try {
      const { imported } = await importWishes(listId, [...picked]);
      haptic.success();
      toast(`${imported} vœu${imported > 1 ? 'x' : ''} ajouté${imported > 1 ? 's' : ''}`);
      onDone();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
      setSaving(false);
    }
  }

  const grid = (items: MyWish[], dim?: boolean) => (
    <View style={styles.grid}>
      {items.map((w) => {
        const on = picked.has(w.id);
        const price = formatPrice(w.price);
        return (
          <Pressable key={w.id} onPress={() => toggle(w.id)} style={[styles.tile, { width: size }, on && styles.tileOn, dim && !on && { opacity: 0.55 }]}>
            <View style={[styles.tileImage, { height: size }]}>
              {w.imageUrl ? (
                <Image source={thumb(w.imageUrl, 400)} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={w.id} transition={120} />
              ) : (
                <Icon name={Icons.photo} size={22} color={Colors.text3} />
              )}
              <View style={[styles.tileCheck, on && styles.tileCheckOn]}>{on && <Icon name={Icons.check} size={12} color={Colors.bg} weight="bold" />}</View>
            </View>
            <View style={{ padding: Space.sm, gap: 2 }}>
              <Txt variant="footnote" numberOfLines={2} style={{ fontFamily: Fonts.medium }}>
                {w.title}
              </Txt>
              <Txt variant="micro" color="text3" numberOfLines={1}>
                {[price, w.collection.name].filter(Boolean).join(' · ')}
              </Txt>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: Space.xl, paddingBottom: Space.x3, gap: Space.lg }}>
        <Animated.View entering={FadeIn.duration(250)} style={{ gap: Space.sm }}>
          <Txt style={styles.title}>Ajoutez des vœux</Txt>
          <Txt variant="body" color="text2">
            Piochez dans vos autres listes{budget ? `. Ceux à moins de ${budget}\u00a0€ d’abord` : ''}. Vous pourrez aussi en ajouter de nouveaux.
          </Txt>
        </Animated.View>
        {!wishes ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ width: size, height: size + 50, borderRadius: Radius.lg }} />
            ))}
          </View>
        ) : candidates.length === 0 ? (
          <Txt color="text3">Vous n’avez pas encore d’autres vœux. Ajoutez-en directement depuis la liste.</Txt>
        ) : (
          <>
            {budget && inBudget.length > 0 && (
              <Txt variant="footnote" color="text2">
                {inBudget.length} idée{inBudget.length > 1 ? 's' : ''} dans votre budget
              </Txt>
            )}
            {grid(inBudget)}
            {over.length > 0 && (
              <Txt variant="footnote" color="text3">
                Au-dessus de {budget}{'\u00a0'}€ · {over.length}
              </Txt>
            )}
            {over.length > 0 && grid(over, true)}
          </>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + Space.sm }]}>
        <Button
          title={picked.size ? `Ajouter ${picked.size} vœu${picked.size > 1 ? 'x' : ''}` : 'Terminer'}
          variant={picked.size ? 'primary' : 'secondary'}
          onPress={add}
          loading={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', paddingHorizontal: Space.xs },
  intro: { paddingHorizontal: Space.xl, paddingTop: Space.lg, gap: Space.xxl },
  title: { fontFamily: Fonts.semibold, fontSize: 30, lineHeight: 36, color: Colors.text, letterSpacing: -0.4 },
  hero: {
    gap: Space.lg,
    padding: Space.xl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(232,200,114,0.3)',
  },
  heroIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,200,114,0.12)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  tile: { borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden' },
  tileOn: { borderColor: GOLD },
  tileImage: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  tileCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCheckOn: { backgroundColor: GOLD, borderColor: GOLD },
  footer: { paddingHorizontal: Space.xl, paddingTop: Space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, backgroundColor: Colors.bg },
});
