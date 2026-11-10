import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ErrorText, Field, Txt } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { Colors, Radius, Space } from '@/constants/theme';
import { invalidate } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';

export default function NewCollectionScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return setError('Le nom est requis.');
    setSaving(true);
    setError(null);
    try {
      await api('/api/collections', { method: 'POST', body: { name: name.trim(), isPublic } });
      invalidate('/api/collections');
      haptic.success();
      toast('Collection créée');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + Space.lg }]}>
      <Txt variant="title2">Nouvelle collection</Txt>
      <Field
        label="Nom"
        value={name}
        onChangeText={(v) => {
          setName(v);
          setError(null);
        }}
        placeholder="🎂 Anniversaire"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={create}
      />
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyMedium">Collection publique</Txt>
          <Txt variant="footnote" color="text2">
            Vos proches peuvent la voir avec le lien et réserver des cadeaux.
          </Txt>
        </View>
        <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: Colors.text, false: Colors.muted }} thumbColor={isPublic ? Colors.bg : Colors.text2} />
      </View>
      <ErrorText message={error} />
      <Button title="Créer la collection" onPress={create} loading={saving} disabled={!name.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Space.xl, paddingTop: Space.x3, gap: Space.xl, backgroundColor: Colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.lg, padding: Space.lg, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
});
