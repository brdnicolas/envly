import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons, type IconName } from '@/components/icon';
import { Button, ErrorText, Txt } from '@/components/primitives';
import { Colors, Fonts, Radius, Space } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import appIcon from '../../assets/images/logo-mark.png';

const GOLD = '#E8C872';

/** A wish card drawn in code (no network needed before sign-in). */
const CARDS = [
  { emoji: '🎧', title: 'Casque sans fil', price: '349 €', bg: '#D4D4D8', x: -96, y: 14, r: -8, delay: 0 },
  { emoji: '🕯️', title: 'Bougeoir vague', price: '42 €', bg: '#93A5F5', x: 0, y: -12, r: 2, delay: 300, reserved: true },
  { emoji: '👟', title: 'Baskets running', price: '140 €', bg: '#A7E3B5', x: 96, y: 18, r: 8, delay: 600 },
];

function FloatingCard({ card }: { card: (typeof CARDS)[number] }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(
      withDelay(
        card.delay,
        withRepeat(
          withSequence(
            withTiming(-7, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
        ),
      ),
    );
  }, [y, card.delay]);
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));

  return (
    // Placement on a plain View: the entering animation drives its own transform and would override it.
    <View style={[styles.cardWrap, { transform: [{ translateX: card.x }, { translateY: card.y }, { rotate: `${card.r}deg` }] }]}>
      <Animated.View entering={FadeInDown.delay(150 + card.delay / 3).duration(700)}>
        <Animated.View style={[styles.card, float]}>
          <View style={[styles.cardImage, { backgroundColor: card.bg }]}>
            <Txt style={{ fontSize: 34, lineHeight: 42 }}>{card.emoji}</Txt>
            {card.reserved && (
              <View style={styles.reserved}>
                <Icon name={Icons.check} size={9} color="#fff" weight="bold" />
                <Txt style={styles.reservedText}>Réservé</Txt>
              </View>
            )}
          </View>
          <View style={{ padding: 8, gap: 1 }}>
            <Txt variant="micro" numberOfLines={1} style={{ fontFamily: Fonts.medium, color: Colors.text }}>
              {card.title}
            </Txt>
            <Txt variant="micro" color="text3">
              {card.price}
            </Txt>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Point({ icon, label, gold }: { icon: IconName; label: string; gold?: boolean }) {
  return (
    <View style={styles.point}>
      <View style={[styles.pointIcon, gold && { backgroundColor: 'rgba(232,200,114,0.14)' }]}>
        <Icon name={icon} size={15} color={gold ? GOLD : Colors.text} />
      </View>
      <Txt variant="callout" color="text2">
        {label}
      </Txt>
    </View>
  );
}

/**
 * Welcome screen. Sign in with Apple is native; Google and email happen on envly.fr,
 * in a secure browser sheet that hands the session back to the app.
 */
export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithBrowser, signInWithApple } = useAuth();
  const [loading, setLoading] = useState<'signin' | 'signup' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  async function apple() {
    if (loading) return;
    setLoading('apple');
    setError(null);
    try {
      await signInWithApple();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(null);
    }
  }

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
    <View style={[styles.container, { paddingTop: insets.top + Space.md, paddingBottom: insets.bottom + Space.lg }]}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.brand}>
        <Image alt="" source={appIcon} style={styles.logo} />
        <Txt variant="headline">Envly</Txt>
      </Animated.View>

      {/* Scene */}
      <View style={styles.scene}>
        {CARDS.map((c) => (
          <FloatingCard key={c.title} card={c} />
        ))}
        <Animated.View entering={FadeInDown.delay(700).duration(700)} style={styles.santa}>
          <Txt variant="micro" style={{ color: GOLD, letterSpacing: 1.4 }}>
            SECRET SANTA
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <View style={styles.santaAvatar}>
              <Txt style={{ color: '#fff', fontFamily: Fonts.semibold, fontSize: 13 }}>J</Txt>
            </View>
            <View>
              <Txt variant="micro" color="text3">
                Vous offrez à
              </Txt>
              <Txt variant="footnote" style={{ fontFamily: Fonts.semibold }}>
                Jules
              </Txt>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Pitch */}
      <Animated.View entering={FadeInDown.delay(250).duration(700)} style={{ gap: Space.md }}>
        <Txt style={styles.headline}>
          Offrez juste.{'\n'}
          <Txt style={[styles.headline, { color: Colors.text3 }]}>Gardez la surprise.</Txt>
        </Txt>
        <View style={{ gap: Space.sm, paddingTop: Space.xs }}>
          <Point icon={Icons.link} label="Ajoutez vos envies depuis n’importe quel site" />
          <Point icon={{ ios: 'eye.slash', android: 'visibility_off' }} label="Vos proches réservent en secret" />
          <Point icon={Icons.gift} label="Organisez un Secret Santa en 1 minute" gold />
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(400).duration(700)} style={{ gap: Space.sm }}>
        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={Radius.md}
            style={{ height: 50, opacity: loading && loading !== 'apple' ? 0.4 : 1 }}
            onPress={() => void apple()}
          />
        )}
        <Button
          title="Créer un compte"
          variant={appleAvailable ? 'secondary' : 'primary'}
          onPress={() => void go('signup')}
          loading={loading === 'signup'}
          disabled={!!loading}
        />
        <Button title="J’ai déjà un compte" variant="ghost" onPress={() => void go('signin')} loading={loading === 'signin'} disabled={!!loading} />
        <ErrorText message={error} />
        <Txt variant="micro" color="text3" center>
          {appleAvailable ? 'Apple, Google ou e-mail' : 'Google ou e-mail'} · gratuit, sans publicité
        </Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Space.xl, justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 22, height: 24 },
  scene: { height: 250, alignItems: 'center', justifyContent: 'center', marginBottom: Space.md },
  cardWrap: { position: 'absolute' },
  card: {
    width: 112,
    borderRadius: Radius.lg,
    backgroundColor: '#161618',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  cardImage: { height: 104, alignItems: 'center', justifyContent: 'center' },
  reserved: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  reservedText: { color: '#fff', fontSize: 9, lineHeight: 12, fontFamily: Fonts.medium },
  santa: {
    position: 'absolute',
    right: 0,
    bottom: -40,
    padding: 10,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(22,22,24,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(232,200,114,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  santaAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5487C', alignItems: 'center', justifyContent: 'center' },
  headline: { fontFamily: Fonts.semibold, fontSize: 36, lineHeight: 41, letterSpacing: -0.8, color: Colors.text },
  point: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  pointIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.muted },
});
