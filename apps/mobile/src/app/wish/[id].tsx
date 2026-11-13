import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { Button, Divider, ErrorText, Field, IconButton, Skeleton, Txt } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { Colors, Radius, Space, Type } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { confirm, deleteWish, openProduct, updateWish } from '@/lib/actions';
import { errorMessage, formatPrice } from '@/lib/api';
import { domainOf, parsePriceInput } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { CollectionDetail, Wish } from '@/lib/types';

/**
 * Wish viewer, presented as a sheet:
 * swipe down to close · swipe left/right for the previous/next wish · double-tap the photo to favourite.
 */
export default function WishViewer() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const { id, collectionId, edit } = useLocalSearchParams<{ id: string; collectionId: string; edit?: string }>();
  const { data, mutate } = useApi<CollectionDetail>(`/api/collections/${collectionId}`);
  const wishes = data?.wishes ?? [];
  const startIndex = Math.max(
    0,
    wishes.findIndex((w) => w.id === id),
  );
  const [picked, setIndex] = useState<number | null>(null);
  const index = Math.min(picked ?? startIndex, Math.max(wishes.length - 1, 0));
  const current = wishes[index];

  if (!data || !current) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: 64, paddingHorizontal: Space.lg, gap: Space.lg }}>
        <Skeleton style={{ aspectRatio: 1, borderRadius: Radius.xl }} />
        <Skeleton style={{ height: 24, width: '80%' }} />
        <Skeleton style={{ height: 24, width: '30%' }} />
      </View>
    );
  }
  const collection: CollectionDetail = data;

  function patchLocal(wishId: string, patch: Partial<Wish>) {
    mutate({ ...collection, wishes: collection.wishes.map((w) => (w.id === wishId ? { ...w, ...patch } : w)) });
  }

  async function togglePriority(w: Wish) {
    const next = !w.isPriority;
    haptic.select();
    patchLocal(w.id, { isPriority: next });
    try {
      await updateWish(w.id, { isPriority: next });
    } catch (e) {
      patchLocal(w.id, { isPriority: !next });
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  async function save(w: Wish, patch: Partial<Wish>) {
    await updateWish(w.id, patch);
    patchLocal(w.id, patch);
    toast('Modifications enregistrées');
  }

  async function remove(w: Wish) {
    const ok = await confirm('Supprimer ce souhait ?', w.title, 'Supprimer');
    if (!ok) return;
    try {
      await deleteWish(w.id);
      const rest = collection.wishes.filter((x) => x.id !== w.id);
      mutate({ ...collection, wishes: rest });
      toast('Souhait supprimé');
      if (!rest.length) router.back();
      else setIndex(Math.min(index, rest.length - 1));
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.grabber} />
      <View style={styles.topBar}>
        <IconButton icon={Icons.close} label="Fermer" onPress={() => router.back()} />
        <Txt variant="footnote" color="text2" accessibilityLabel={`Souhait ${index + 1} sur ${wishes.length}`}>
          {index + 1} / {wishes.length}
        </Txt>
        <IconButton
          icon={Icons.share}
          label="Partager"
          onPress={() => void Share.share({ message: current.url ? `${current.title} ${current.url}` : current.title })}
        />
      </View>

      <FlatList
        data={wishes}
        keyExtractor={(w) => w.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index) haptic.select();
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <WishPage
              wish={item}
              collectionName={collection.name}
              bottomInset={insets.bottom}
              readOnly={collection.role === 'viewer'}
              startEditing={edit === '1' && item.id === id}
              onTogglePriority={() => void togglePriority(item)}
              onSave={(patch) => save(item, patch)}
              onDelete={() => void remove(item)}
            />
          </View>
        )}
      />
    </View>
  );
}

function WishPage({
  wish,
  collectionName,
  bottomInset,
  readOnly,
  startEditing,
  onTogglePriority,
  onSave,
  onDelete,
}: {
  wish: Wish;
  collectionName: string;
  bottomInset: number;
  readOnly: boolean;
  startEditing: boolean;
  onTogglePriority: () => void;
  onSave: (patch: Partial<Wish>) => Promise<void>;
  onDelete: () => void;
}) {
  const [ratio, setRatio] = useState(1);
  const [editing, setEditing] = useState(startEditing && !readOnly);
  const [title, setTitle] = useState(wish.title);
  const [price, setPrice] = useState(wish.price != null ? String(wish.price).replace('.', ',') : '');
  const [note, setNote] = useState(wish.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);

  const domain = domainOf(wish.url);
  const priceLabel = formatPrice(wish.price);

  function onImagePress() {
    if (readOnly) return;
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      if (!wish.isPriority) setBurst((b) => b + 1);
      onTogglePriority();
    } else {
      lastTap.current = now;
    }
  }

  function startEdit() {
    setTitle(wish.title);
    setPrice(wish.price != null ? String(wish.price).replace('.', ',') : '');
    setNote(wish.description ?? '');
    setError(null);
    setEditing(true);
  }

  async function save() {
    if (!title.trim()) return setError('Le titre est requis.');
    setSaving(true);
    try {
      await onSave({ title: title.trim(), price: parsePriceInput(price), description: note.trim() || null });
      setEditing(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Space.lg, paddingBottom: bottomInset + Space.x3, gap: Space.xl }}>
        <Pressable
          onPress={onImagePress}
          accessibilityRole="imagebutton"
          accessibilityLabel="Photo du produit. Toucher deux fois pour ajouter aux favoris."
          style={styles.imageCard}>
          {wish.imageUrl ? (
            <Image
              alt=""
              source={wish.imageUrl}
              style={{ width: '100%', aspectRatio: ratio }}
              contentFit="cover"
              transition={150}
              onLoad={(e) => {
                const { width, height } = e.source;
                if (width && height) setRatio(Math.min(Math.max(width / height, 0.75), 1.4));
              }}
            />
          ) : (
            <View style={styles.placeholder}>
              <Icon name={Icons.photo} size={28} color={Colors.text3} />
            </View>
          )}
          {wish.isPriority && (
            <View style={styles.priorityTag}>
              <Icon name={Icons.starFill} size={12} color="#FFFFFF" />
            </View>
          )}
          {burst > 0 && (
            <Animated.View key={burst} entering={FadeIn.duration(120)} exiting={FadeOut.duration(400)} style={styles.burst} pointerEvents="none">
              <BurstStar onDone={() => setBurst(0)} />
            </Animated.View>
          )}
        </Pressable>

        {editing ? (
          <View style={{ gap: Space.lg }}>
            <Field label="Titre" value={title} onChangeText={setTitle} multiline style={{ minHeight: 0 }} />
            <Field label="Prix" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0,00" right={<Txt color="text3">€</Txt>} />
            <Field label="Note" value={note} onChangeText={setNote} placeholder="Taille, couleur, détails…" multiline />
            <ErrorText message={error} />
            <View style={{ flexDirection: 'row', gap: Space.sm }}>
              <Button title="Annuler" variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
              <Button title="Enregistrer" onPress={save} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <View style={{ gap: Space.lg }}>
            <View style={{ gap: Space.sm }}>
              <Txt variant="footnote" color="text3">
                {[domain, collectionName].filter(Boolean).join(' · ')}
              </Txt>
              <Txt variant="title2">{wish.title}</Txt>
              {priceLabel && <Txt style={[Type.priceLarge, { color: Colors.text }]}>{priceLabel}</Txt>}
            </View>

            {!!wish.description && (
              <Txt variant="body" color="text2">
                {wish.description}
              </Txt>
            )}

            {wish.url && <Button title="Voir le produit" iconRight={Icons.arrowUpRight} onPress={() => openProduct(wish.url!)} />}

            {!readOnly && (
              <View style={styles.list}>
                <Row
                  icon={wish.isPriority ? Icons.starFill : Icons.star}
                  iconColor={wish.isPriority ? Colors.star : Colors.text}
                  label={wish.isPriority ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  onPress={onTogglePriority}
                />
                <Divider style={{ marginLeft: 50 }} />
                <Row icon={Icons.pencil} label="Modifier" onPress={startEdit} />
                <Divider style={{ marginLeft: 50 }} />
                <Row icon={Icons.trash} iconColor={Colors.danger} label="Supprimer" danger onPress={onDelete} />
              </View>
            )}
          </View>
        )}
    </KeyboardAwareScrollView>
  );
}

/** Star shown briefly after a double-tap. */
function BurstStar({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <View style={styles.burstInner}>
      <Icon name={Icons.starFill} size={56} color={Colors.star} />
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
  danger,
  iconColor,
}: {
  icon: typeof Icons.star;
  label: string;
  onPress: () => void;
  danger?: boolean;
  iconColor?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.elevated }]} accessibilityRole="button">
      <Icon name={icon} size={18} color={iconColor ?? Colors.text} />
      <Txt variant="bodyMedium" style={{ flex: 1, color: danger ? Colors.danger : Colors.text }}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: Colors.muted, marginTop: 8 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Space.sm, paddingVertical: Space.xs },
  imageCard: { borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.border },
  placeholder: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card },
  priorityTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: Colors.star,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burst: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  burstInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(10,10,10,0.55)', alignItems: 'center', justifyContent: 'center' },
  list: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.lg, paddingHorizontal: Space.lg, height: 52 },
});
