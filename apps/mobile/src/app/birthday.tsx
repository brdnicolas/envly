import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorText, Field, Txt } from '@/components/primitives';
import { Sheet, useSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { Space } from '@/constants/theme';
import { invalidate, useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import { parseBirthdayInput } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { User } from '@/lib/types';

/** Birthday (day + month): friends get a reminder two weeks before. */
function BirthdayContent() {
  const toast = useToast();
  const { close } = useSheet();
  const { data } = useApi<User>('/api/profile');
  const current = data?.birthday;
  const [value, setValue] = useState(current ? `${String(current.day).padStart(2, '0')}/${String(current.month).padStart(2, '0')}` : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(clear = false) {
    const birthday = clear ? null : parseBirthdayInput(value);
    if (!clear && !birthday) return setError('Format attendu : JJ/MM, par exemple 24/03.');
    setSaving(true);
    try {
      await api('/api/profile', { method: 'PATCH', body: { birthday } });
      invalidate('/api/profile');
      haptic.success();
      toast(clear ? 'Anniversaire retiré' : 'Anniversaire enregistré 🎂');
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ gap: Space.xs }}>
        <Txt variant="title2">Mon anniversaire</Txt>
        <Txt variant="subhead" color="text2">
          Vos amis recevront un rappel deux semaines avant pour découvrir vos envies. L’année n’est jamais demandée.
        </Txt>
      </View>
      <Field
        label="Jour et mois"
        value={value}
        onChangeText={(v) => {
          setValue(v);
          setError(null);
        }}
        placeholder="JJ/MM"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => void save()}
      />
      <ErrorText message={error} />
      <Button title="Enregistrer" onPress={() => void save()} loading={saving} disabled={!value.trim()} />
      {!!current && <Button title="Retirer mon anniversaire" variant="ghost" onPress={() => void save(true)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Space.xl, paddingTop: Space.md, paddingBottom: Space.md, gap: Space.xl },
});

export default function BirthdayScreen() {
  return (
    <Sheet>
      <BirthdayContent />
    </Sheet>
  );
}
