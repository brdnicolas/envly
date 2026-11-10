import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { Txt } from '@/components/primitives';
import { Colors, Radius, Space, Type } from '@/constants/theme';
import { invalidate } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import type { CollectionSummary } from '@/lib/types';

/** Field showing the chosen collection; opens a searchable sheet to pick or create one. */
export function CollectionPicker({
  collections,
  value,
  onChange,
}: {
  collections: CollectionSummary[] | undefined;
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = collections?.find((c) => c.id === value);

  return (
    <View style={{ gap: Space.sm }}>
      <Txt variant="callout">Collection</Txt>
      <Pressable
        onPress={() => {
          haptic.select();
          setOpen(true);
        }}
        disabled={!collections}
        accessibilityRole="button"
        accessibilityLabel={`Collection : ${current?.name ?? 'aucune'}`}
        accessibilityHint="Choisir une autre collection"
        style={({ pressed }) => [styles.field, pressed && { opacity: 0.6 }]}>
        {current ? (
          <>
            <Thumb collection={current} size={36} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyMedium" numberOfLines={1}>
                {current.name}
              </Txt>
              <Txt variant="footnote" color="text3">
                {countLabel(current)}
              </Txt>
            </View>
          </>
        ) : (
          <Txt color="text3" style={{ flex: 1 }}>
            {collections ? 'Choisir une collection' : 'Chargement…'}
          </Txt>
        )}
        <Txt variant="footnote" color="text2">
          Changer
        </Txt>
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <PickerSheet
          collections={collections ?? []}
          value={value}
          onClose={() => setOpen(false)}
          onPick={(id) => {
            haptic.select();
            onChange(id);
            setOpen(false);
          }}
        />
      </Modal>
    </View>
  );
}

function PickerSheet({
  collections,
  value,
  onPick,
  onClose,
}: {
  collections: CollectionSummary[];
  value: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = normalize(query.trim());
  const items = q ? collections.filter((c) => normalize(c.name).includes(q)) : collections;

  async function create() {
    const name = newName.trim();
    if (!name || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api<{ id: string }>('/api/collections', { method: 'POST', body: { name, isPublic: true } });
      invalidate('/api/collections');
      haptic.success();
      onPick(created.id);
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.grabber} />
      <View style={styles.sheetHeader}>
        <Txt variant="headline">Choisir une collection</Txt>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fermer" style={styles.close}>
          <Icon name={Icons.close} size={14} color={Colors.text2} weight="semibold" />
        </Pressable>
      </View>

      {collections.length > 6 && (
        <View style={styles.search}>
          <Icon name={{ ios: 'magnifyingglass', android: 'search' }} size={15} color={Colors.text3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher"
            placeholderTextColor={Colors.text3}
            selectionColor={Colors.text}
            keyboardAppearance="dark"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            style={[Type.body, styles.searchInput]}
          />
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: insets.bottom + Space.lg }}
        ListHeaderComponent={
          creating ? (
            <View style={styles.createRow}>
              <View style={[styles.thumb, styles.newThumb, { width: 48, height: 48 }]}>
                <Icon name={Icons.plus} size={18} />
              </View>
              <TextInput
                value={newName}
                onChangeText={(v) => {
                  setNewName(v);
                  setError(null);
                }}
                placeholder="Nom de la collection"
                placeholderTextColor={Colors.text3}
                selectionColor={Colors.text}
                keyboardAppearance="dark"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={create}
                style={[Type.body, { flex: 1, color: Colors.text, paddingVertical: 10 }]}
              />
              <Pressable onPress={create} disabled={!newName.trim() || saving} hitSlop={8} style={[styles.createBtn, !newName.trim() && { opacity: 0.4 }]}>
                {saving ? <ActivityIndicator size="small" color={Colors.bg} /> : <Txt variant="footnote" style={{ color: Colors.bg, fontWeight: '600' }}>Créer</Txt>}
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setNewName(query.trim());
                setCreating(true);
              }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              accessibilityRole="button">
              <View style={[styles.thumb, styles.newThumb, { width: 48, height: 48 }]}>
                <Icon name={Icons.plus} size={18} />
              </View>
              <Txt variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                {query.trim() ? `Créer « ${query.trim()} »` : 'Nouvelle collection'}
              </Txt>
            </Pressable>
          )
        }
        ListFooterComponent={error ? <Txt variant="footnote" color="danger" style={{ paddingHorizontal: Space.lg }}>{error}</Txt> : undefined}
        ListEmptyComponent={
          <Txt color="text3" center style={{ paddingVertical: Space.x3 }}>
            Aucune collection ne correspond.
          </Txt>
        }
        renderItem={({ item }) => {
          const selected = item.id === value;
          return (
            <Pressable
              onPress={() => onPick(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [styles.row, selected && styles.selectedRow, pressed && styles.pressed]}>
              <Thumb collection={item} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyMedium" numberOfLines={1}>
                  {item.name}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {!item.isPublic && <Icon name={Icons.lock} size={11} color={Colors.text3} />}
                  <Txt variant="footnote" color="text3">
                    {countLabel(item)}
                  </Txt>
                </View>
              </View>
              {selected && <Icon name={Icons.check} size={18} weight="semibold" />}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function Thumb({ collection, size }: { collection: CollectionSummary; size: number }) {
  const uri = collection.wishes.find((w) => w.imageUrl)?.imageUrl;
  return (
    <View style={[styles.thumb, { width: size, height: size }]}>
      {uri ? (
        <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={uri} transition={120} />
      ) : (
        <Icon name={Icons.gift} size={size * 0.4} color={Colors.text3} />
      )}
    </View>
  );
}

function countLabel(c: CollectionSummary) {
  const n = c._count.wishes;
  return n === 0 ? 'Vide' : `${n} souhait${n > 1 ? 's' : ''}`;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sheet: { flex: 1, backgroundColor: Colors.bg },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: Colors.borderStrong, marginTop: 6 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.lg, paddingTop: Space.md, paddingBottom: Space.md },
  close: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.muted, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    marginHorizontal: Space.lg,
    marginBottom: Space.sm,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
  },
  searchInput: { flex: 1, color: Colors.text, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.lg, paddingVertical: 8 },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.lg, paddingVertical: 8 },
  selectedRow: { backgroundColor: Colors.card },
  pressed: { backgroundColor: Colors.card },
  thumb: { borderRadius: Radius.sm, overflow: 'hidden', backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  newThumb: { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.borderStrong, backgroundColor: 'transparent' },
  createBtn: { height: 32, paddingHorizontal: 14, borderRadius: Radius.pill, backgroundColor: Colors.text, alignItems: 'center', justifyContent: 'center' },
});
