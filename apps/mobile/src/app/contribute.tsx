import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorText, Field, Txt } from '@/components/primitives';
import { Sheet, useSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage, formatPrice } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { contribute, useMyContributions, withdraw } from '@/lib/contributions';
import { parsePriceInput } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { CollectionDetail } from '@/lib/types';

const GOLD = '#E8C872';

/** Group gift on a friend's wish: who's in, how much is left, join or withdraw. */
function ContributeContent() {
  const toast = useToast();
  const { close } = useSheet();
  const { user } = useAuth();
  const { wishId, collectionId } = useLocalSearchParams<{ wishId: string; collectionId: string }>();
  const { data, mutate } = useApi<CollectionDetail>(`/api/collections/${collectionId}`);
  const mineTokens = useMyContributions();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wish = data?.wishes.find((w) => w.id === wishId);
  const contributions = wish?.contributions ?? [];
  const total = contributions.reduce((n, c) => n + c.amount, 0);
  const remaining = wish?.price ? Math.max(0, wish.price - total) : null;
  const pct = wish?.price ? Math.min(1, total / wish.price) : null;
  const mine = contributions.find((c) => mineTokens[c.id]);

  function apply(next: typeof contributions) {
    if (data) mutate({ ...data, wishes: data.wishes.map((w) => (w.id === wishId ? { ...w, contributions: next } : w)) });
  }

  async function join() {
    const value = parsePriceInput(amount);
    if (!value) return setError('Indiquez un montant.');
    setBusy(true);
    setError(null);
    try {
      apply(await contribute(wishId, collectionId, user?.name ?? 'Un ami', value));
      haptic.success();
      toast('Participation enregistrée 🎁');
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!mine) return;
    setBusy(true);
    try {
      apply(await withdraw(wishId, collectionId, mine.id));
      toast('Participation retirée');
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ gap: Space.xs }}>
        <Txt variant="title2">Offrir à plusieurs</Txt>
        <Txt variant="subhead" color="text2" numberOfLines={2}>
          {wish?.title ?? ''}
        </Txt>
      </View>

      <View style={styles.card}>
        <Txt variant="bodyMedium">
          {formatPrice(total) ?? '0 €'}
          {wish?.price ? <Txt color="text3">{` / ${formatPrice(wish.price)}`}</Txt> : null}
        </Txt>
        {pct !== null && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
        )}
        {contributions.length ? (
          contributions.map((c) => (
            <View key={c.id} style={styles.row}>
              <Txt variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                {mineTokens[c.id] ? 'Vous' : c.name}
              </Txt>
              <Txt variant="callout" color="text2">
                {formatPrice(c.amount)}
              </Txt>
            </View>
          ))
        ) : (
          <Txt variant="footnote" color="text3">
            Personne pour l’instant. Lancez la cagnotte, vos amis pourront s’y joindre.
          </Txt>
        )}
      </View>

      <Txt variant="footnote" color="text3">
        Les participants voient les noms pour s’organiser. {data?.user.name ?? 'Le propriétaire'} ne voit rien.
      </Txt>

      {mine ? (
        <Button title="Retirer ma participation" variant="outline" onPress={() => void leave()} loading={busy} />
      ) : (
        <>
          <Field
            label="Je mets"
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              setError(null);
            }}
            placeholder={remaining ? `${Math.ceil(remaining)} €` : '20 €'}
            keyboardType="decimal-pad"
          />
          <Button title="Je participe" onPress={() => void join()} loading={busy} disabled={!amount.trim()} />
        </>
      )}
      <ErrorText message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Space.xl, paddingTop: Space.md, paddingBottom: Space.md, gap: Space.lg },
  card: { gap: Space.sm, padding: Space.lg, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.muted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: GOLD },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
});

export default function ContributeScreen() {
  return (
    <Sheet>
      <ContributeContent />
    </Sheet>
  );
}
