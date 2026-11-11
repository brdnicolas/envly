import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionPicker } from '@/components/collection-picker';
import { Icons } from '@/components/icon';
import { NavBar } from '@/components/nav-bar';
import { Button, EmptyState, ErrorText, Skeleton, Txt } from '@/components/primitives';
import { AvatarStack, SantaEyebrow } from '@/components/santa';
import { useToast } from '@/components/toast';
import { Colors, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { registerForPush } from '@/lib/push';
import { joinByCode, santaMeta } from '@/lib/santa';
import type { CollectionSummary, Person } from '@/lib/types';

type Preview = {
  id: string;
  name: string;
  budget: number | null;
  date: string | null;
  status: 'OPEN' | 'DRAWN';
  organizer: Person;
  members: Person[];
  joined: boolean;
};

/** Opened from an invite link (envly://s/CODE): preview, pick a list, join. */
export default function JoinSantaScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data, error } = useApi<Preview>(`/api/santas/join/${code}`);
  const { data: collections } = useApi<CollectionSummary[]>('/api/collections');
  const [collectionId, setCollectionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Already in: go straight to it.
  useEffect(() => {
    if (data?.joined) router.replace({ pathname: '/santa/[id]', params: { id: data.id } });
  }, [data]);

  async function join() {
    setSaving(true);
    setJoinError(null);
    try {
      const santa = await joinByCode(code, collectionId || null);
      haptic.success();
      toast('Vous participez 🎁');
      void registerForPush({ ask: true });
      router.replace({ pathname: '/santa/[id]', params: { id: santa.id } });
    } catch (e) {
      setJoinError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <NavBar />
      {!data ? (
        error ? (
          <EmptyState icon={Icons.gift} title="Lien invalide" message="Ce Secret Santa n’existe plus ou le lien est incorrect." />
        ) : (
          <View style={{ padding: Space.lg, gap: Space.lg }}>
            <Skeleton style={{ height: 32, width: '60%' }} />
            <Skeleton style={{ height: 120, borderRadius: Radius.xl }} />
          </View>
        )
      ) : (
        <View style={[styles.body, { paddingBottom: insets.bottom + Space.lg }]}>
          <View style={{ gap: Space.sm }}>
            <SantaEyebrow />
            <Txt variant="title">{data.name}</Txt>
            <Txt variant="subhead" color="text2">
              {[`Organisé par ${data.organizer.name ?? 'un ami'}`, santaMeta(data)].filter(Boolean).join(' · ')}
            </Txt>
          </View>
          <View style={styles.people}>
            <AvatarStack people={data.members} max={7} size={32} />
            <Txt variant="footnote" color="text2">
              {data.members.length} participant{data.members.length > 1 ? 's' : ''}
            </Txt>
          </View>

          {data.status === 'DRAWN' ? (
            <Txt variant="body" color="text2">
              Le tirage a déjà eu lieu, il n’est plus possible de rejoindre.
            </Txt>
          ) : (
            <>
              <CollectionPicker collections={collections} value={collectionId} onChange={setCollectionId} />
              <Txt variant="footnote" color="text3" style={{ marginTop: -Space.md }}>
                La liste que verra la personne qui vous tire au sort.
              </Txt>
              <View style={{ flex: 1 }} />
              <ErrorText message={joinError} />
              <Button title="Participer" onPress={join} loading={saving} />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: Space.lg, gap: Space.xl },
  people: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
});
