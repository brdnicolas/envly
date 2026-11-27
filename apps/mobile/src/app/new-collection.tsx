import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Button, ErrorText, Field, Txt } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { Sheet, useSheet } from '@/components/sheet';
import { Colors, Radius, Space } from '@/constants/theme';
import { invalidate } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import { parseDateInput } from '@/lib/format';
import { haptic } from '@/lib/haptics';

/** Create a collection, or edit one when opened with `id` (+ current values). */
function CollectionFormScreenContent() {
  const toast = useToast();
  const { close } = useSheet();
  const params = useLocalSearchParams<{ id?: string; name?: string; description?: string; isPublic?: string; eventDate?: string }>();
  const editing = !!params.id;
  const [name, setName] = useState(params.name ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [isPublic, setIsPublic] = useState(params.isPublic !== 'false');
  const [eventDate, setEventDate] = useState(params.eventDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return setError('Le nom est requis.');
    const date = parseDateInput(eventDate);
    if (date === undefined) return setError('Date invalide (format JJ/MM/AAAA).');
    setSaving(true);
    setError(null);
    try {
      const body = { name: name.trim(), isPublic, eventDate: date, ...(editing && { description: description.trim() || null }) };
      if (editing) await api(`/api/collections/${params.id}`, { method: 'PATCH', body });
      else await api('/api/collections', { method: 'POST', body });
      invalidate('/api/collections');
      haptic.success();
      toast(editing ? 'Modifications enregistrées' : 'Collection créée');
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Txt variant="title2">{editing ? 'Modifier la collection' : 'Nouvelle collection'}</Txt>
      <Field
        label="Nom"
        value={name}
        onChangeText={(v) => {
          setName(v);
          setError(null);
        }}
        placeholder="🎂 Anniversaire"
        autoFocus={!editing}
        returnKeyType="done"
        onSubmitEditing={create}
      />
      {editing && (
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Une note pour vos proches (facultatif)" multiline />
      )}
      <Field
        label="Date de l’événement (facultatif)"
        value={eventDate}
        onChangeText={(v) => {
          setEventDate(v);
          setError(null);
        }}
        placeholder="JJ/MM/AAAA"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyMedium">Collection publique</Txt>
          <Txt variant="footnote" color="text2">
            Vos proches peuvent la voir avec le lien et réserver des cadeaux.
          </Txt>
        </View>
        <Switch value={isPublic} onValueChange={setIsPublic} />
      </View>
      <ErrorText message={error} />
      <Button title={editing ? 'Enregistrer' : 'Créer la collection'} onPress={create} loading={saving} disabled={!name.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Space.xl, paddingTop: Space.md, paddingBottom: Space.md, gap: Space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.lg, padding: Space.lg, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
});

export default function CollectionFormScreen() {
  return (
    <Sheet>
      <CollectionFormScreenContent />
    </Sheet>
  );
}
