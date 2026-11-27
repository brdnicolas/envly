import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, type ScrollViewInstance, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icons } from '@/components/icon';
import { NavBar } from '@/components/nav-bar';
import { IconButton, Txt } from '@/components/primitives';
import { Colors, Fonts, Radius, Space, Type } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { sendSantaMessage } from '@/lib/santa';
import type { Santa, SantaThreads } from '@/lib/types';

const GOLD = '#E8C872';

/**
 * Anonymous Secret Santa conversation.
 * `thread=recipient`: I ask the person I give to (they don't know it's me).
 * `thread=santa`: I answer my own Secret Santa (I don't know who it is).
 */
export default function SantaChatScreen() {
  const insets = useSafeAreaInsets();
  const { id, thread: rawThread } = useLocalSearchParams<{ id: string; thread?: string }>();
  const thread = rawThread === 'santa' ? 'santa' : 'recipient';
  const { data: santa } = useApi<Santa>(`/api/santas/${id}`);
  const { data, mutate } = useApi<SantaThreads>(`/api/santas/${id}/messages`);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  const messages = data?.[thread] ?? [];
  const recipientName = santa?.assignment?.user.name ?? null;
  const title = thread === 'recipient' ? (recipientName ?? 'Question anonyme') : 'Mon Secret Santa';
  const theirLabel = thread === 'recipient' ? (recipientName ?? 'Réponse') : 'Secret Santa';

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: false }), 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || !data) return;
    setSending(true);
    try {
      const msg = await sendSantaMessage(id, thread, body);
      mutate({ ...data, [thread]: [...data[thread], msg] });
      setText('');
      haptic.success();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavBar title={title} />
      <ScrollView ref={scroll} contentContainerStyle={{ padding: Space.lg, gap: Space.sm, flexGrow: 1 }}>
        <View style={styles.hint}>
          <Txt variant="footnote" color="text2" center>
            {thread === 'recipient'
              ? `${recipientName ?? 'Cette personne'} ne saura pas que c’est vous. Demandez sa taille, sa couleur préférée, si elle a déjà ce livre…`
              : 'La personne qui vous offre un cadeau vous pose des questions. Vous ne saurez pas qui c’est.'}
          </Txt>
        </View>
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.mine ? styles.mine : styles.theirs]}>
            {!m.mine && (
              <Txt variant="micro" color="text3" style={{ fontFamily: Fonts.medium }}>
                {theirLabel}
              </Txt>
            )}
            <Txt variant="body" style={{ color: m.mine ? Colors.bg : Colors.text }}>
              {m.body}
            </Txt>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, Space.md) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          maxLength={500}
          multiline
          placeholder={thread === 'recipient' ? 'Poser une question…' : 'Répondre…'}
          placeholderTextColor={Colors.text3}
          keyboardAppearance="dark"
          style={[Type.body, styles.input]}
        />
        <IconButton
          icon={Icons.send}
          label="Envoyer"
          size={40}
          color={sending || !text.trim() ? Colors.text3 : GOLD}
          onPress={sending || !text.trim() ? undefined : () => void send()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hint: { paddingVertical: Space.md, paddingHorizontal: Space.lg },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg, gap: 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: GOLD },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Space.sm,
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
