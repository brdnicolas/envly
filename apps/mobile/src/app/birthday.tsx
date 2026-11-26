import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
  // Opened automatically once (prompt=1): record that we asked, so it never shows again, even if skipped.
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const prompted = prompt === '1';
  // Whatever the outcome (saved, "je préfère ne pas le dire", swiped away), the prompt is answered
  // when the sheet closes: record it then, so it never shows again. Not on open: if the app is
  // killed while the sheet is up, it will simply be asked again next time.
  useEffect(() => {
    if (!prompted) return;
    return () => {
      void api('/api/profile', { method: 'PATCH', body: { birthdayAsked: true } })
        .then(() => invalidate('/api/profile'))
        .catch(() => {});
    };
  }, [prompted]);
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
        <Txt variant="title2">{prompted ? 'Quand est votre anniversaire ? 🎂' : 'Mon anniversaire'}</Txt>
        <Txt variant="subhead" color="text2">
          Vos amis recevront un rappel deux semaines avant pour découvrir vos envies. Seuls le jour et le mois sont demandés, et c’est
          facultatif.
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
        autoFocus={!prompted}
        returnKeyType="done"
        onSubmitEditing={() => void save()}
      />
      <ErrorText message={error} />
      <Button title="Enregistrer" onPress={() => void save()} loading={saving} disabled={!value.trim()} />
      {!!current && <Button title="Retirer mon anniversaire" variant="ghost" onPress={() => void save(true)} />}
      {prompted && !current && <Button title="Je préfère ne pas le dire" variant="ghost" onPress={() => close()} />}
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
