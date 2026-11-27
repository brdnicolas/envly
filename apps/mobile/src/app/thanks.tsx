import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorText, Field, Txt } from '@/components/primitives';
import { Sheet, useSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { Space } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';

/** Thank whoever offered a received gift, without ever learning who it was. */
function ThanksContent() {
  const toast = useToast();
  const { close } = useSheet();
  const { wishId, title } = useLocalSearchParams<{ wishId: string; title?: string }>();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api(`/api/wishes/${wishId}/thanks`, { method: 'POST', body: { message: message.trim() } });
      haptic.success();
      toast('Merci envoyé 💛');
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ gap: Space.xs }}>
        <Txt variant="title2">Dire merci</Txt>
        <Txt variant="subhead" color="text2">
          {title ? `Pour « ${title} ». ` : ''}Votre message est transmis à la personne qui l’a offert. Elle reste anonyme pour vous.
        </Txt>
      </View>
      <Field value={message} onChangeText={setMessage} placeholder="Merci, il est parfait !" multiline maxLength={500} autoFocus />
      <ErrorText message={error} />
      <Button title="Envoyer" onPress={() => void send()} loading={sending} disabled={!message.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Space.xl, paddingTop: Space.md, paddingBottom: Space.md, gap: Space.xl },
});

export default function ThanksScreen() {
  return (
    <Sheet>
      <ThanksContent />
    </Sheet>
  );
}
