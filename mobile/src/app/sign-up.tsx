import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Divider, ErrorText, Field, Txt } from '@/components/primitives';
import { Colors, Space } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || !email.trim()) return setError('Nom et email requis.');
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    setLoading(true);
    setError(null);
    try {
      await signUp({ name, email, password });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 70 }}>
          <Txt variant="bodyMedium" color="text2">
            Annuler
          </Txt>
        </Pressable>
        <Txt variant="headline">Créer un compte</Txt>
        <View style={{ width: 70 }} />
      </View>
      <Divider />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field label="Nom" value={name} onChangeText={setName} autoComplete="name" textContentType="name" autoFocus />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="8 caractères minimum"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <ErrorText message={error} />
        <Button title="Créer mon compte" onPress={submit} loading={loading} />
        <Txt variant="footnote" color="text3" center>
          En créant un compte, vous acceptez la politique de confidentialité d’Envly.
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.lg, height: 56 },
  container: { padding: Space.xl, gap: Space.lg },
});
