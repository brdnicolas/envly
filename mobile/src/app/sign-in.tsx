import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ErrorText, Field, Txt } from '@/components/primitives';
import { Colors, Fonts, Radius, Space, Type } from '@/constants/theme';
import { API_URL, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import appIcon from '../../assets/images/icon.png';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signInWithBrowser } = useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function google() {
    setLoading('google');
    setError(null);
    try {
      await signInWithBrowser();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(null);
    }
  }

  async function submit() {
    if (!email || !password) return setError('Email et mot de passe requis.');
    setLoading('email');
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Space.lg, paddingBottom: insets.bottom + Space.xl }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Image alt="" source={appIcon} style={styles.logo} />
          <Txt variant="title2">Envly</Txt>
        </View>

        <View style={{ gap: Space.lg }}>
          <Txt style={styles.headline}>
            Wishlists partagées. <Txt style={[styles.headline, { color: Colors.text3 }]}>Surprises préservées.</Txt>
          </Txt>
          <Txt variant="body" color="text2" style={{ fontSize: 16, lineHeight: 24 }}>
            Créez de belles wishlists, partagez-les avec vos proches. Les cadeaux sont réservés anonymement — la surprise reste intacte.
          </Txt>
        </View>

        <View style={{ gap: Space.md }}>
          {showEmail ? (
            <>
              <Field
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoFocus
              />
              <Field
                value={password}
                onChangeText={setPassword}
                placeholder="Mot de passe"
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              <Button title="Se connecter" onPress={submit} loading={loading === 'email'} />
              <View style={styles.links}>
                <Pressable onPress={() => setShowEmail(false)} hitSlop={8}>
                  <Txt variant="footnote" color="text2">
                    Retour
                  </Txt>
                </Pressable>
                <Pressable onPress={() => void WebBrowser.openBrowserAsync(`${API_URL}/forgot-password`)} hitSlop={8}>
                  <Txt variant="footnote" color="text2">
                    Mot de passe oublié ?
                  </Txt>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Pressable
                onPress={google}
                disabled={!!loading}
                style={({ pressed }) => [styles.google, pressed && { opacity: 0.8 }]}
                accessibilityRole="button">
                <Txt style={{ fontFamily: Fonts.bold, fontSize: 16, color: '#4285F4' }}>G</Txt>
                <Txt style={{ fontFamily: Fonts.medium, fontSize: 15, color: Colors.onPrimary }}>
                  {loading === 'google' ? 'Connexion…' : 'Continuer avec Google'}
                </Txt>
              </Pressable>
              <Button title="Se connecter avec un email" variant="outline" onPress={() => setShowEmail(true)} />
            </>
          )}
          <ErrorText message={error} />
        </View>

        <Txt variant="footnote" color="text2" center>
          Pas encore de compte ?{' '}
          <Txt variant="footnote" style={{ fontFamily: Fonts.semibold }} onPress={() => router.push('/sign-up')}>
            S’inscrire
          </Txt>
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: Space.xl, gap: Space.x4, justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 32, height: 32, borderRadius: 8 },
  headline: { ...Type.largeTitle, fontSize: 34, lineHeight: 40, color: Colors.text },
  google: { height: 50, borderRadius: Radius.md, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  links: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Space.xs },
});
