import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ErrorText, Txt } from '@/components/primitives';
import { Colors, Space, Type } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import appIcon from '../../assets/images/logo-mark.png';

/**
 * Welcome screen. Sign-in and sign-up both happen on envly.fr (Google or email),
 * in a secure browser sheet that hands the session back to the app.
 */
export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithBrowser } = useAuth();
  const [loading, setLoading] = useState<'signin' | 'signup' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(mode: 'signin' | 'signup') {
    setLoading(mode);
    setError(null);
    try {
      await signInWithBrowser(mode);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Space.lg, paddingBottom: insets.bottom + Space.xl }]}>
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
        <Button title="Se connecter" onPress={() => void go('signin')} loading={loading === 'signin'} disabled={!!loading} />
        <Button title="Créer un compte" variant="outline" onPress={() => void go('signup')} loading={loading === 'signup'} disabled={!!loading} />
        <ErrorText message={error} />
        <Txt variant="footnote" color="text3" center>
          Google ou email, sur envly.fr
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Space.xl, justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 28, height: 30 },
  headline: { ...Type.largeTitle, fontSize: 34, lineHeight: 40, color: Colors.text },
});
