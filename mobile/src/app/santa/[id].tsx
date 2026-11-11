import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionMenu, type MenuItem } from '@/components/collection-menu';
import { Icon, Icons, type IconName } from '@/components/icon';
import { NavBar } from '@/components/nav-bar';
import { Avatar, Button, EmptyState, Skeleton, Txt } from '@/components/primitives';
import { AvatarStack, Reveal, SantaEyebrow } from '@/components/santa';
import { useToast } from '@/components/toast';
import { Colors, Fonts, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { confirm } from '@/lib/actions';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';
import { thumb } from '@/lib/image';
import { registerForPush } from '@/lib/push';
import { deleteSanta, drawSanta, joinSanta, leaveSanta, removeFromSanta, shareSantaLink } from '@/lib/santa';
import type { CollectionSummary, Santa } from '@/lib/types';

const GOLD = '#E8C872';
const GOLD_SOFT = 'rgba(232,200,114,0.12)';
const DAY = 24 * 3600 * 1000;

export default function SantaScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: santa, error, refreshing, refresh, mutate } = useApi<Santa>(`/api/santas/${id}`);
  const { data: collections } = useApi<CollectionSummary[]>('/api/collections');
  const [now] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, done?: string) {
    setBusy(true);
    try {
      const next = await fn();
      if (next && typeof next === 'object' && 'members' in next) mutate(next as Santa);
      if (done) toast(done);
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (!santa) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <NavBar />
        {error ? (
          <EmptyState icon={Icons.gift} title="Introuvable" message={error} />
        ) : (
          <View style={{ padding: Space.lg, gap: Space.lg, alignItems: 'center' }}>
            <Skeleton style={{ height: 36, width: '70%' }} />
            <Skeleton style={{ height: 28, width: '50%' }} />
            <Skeleton style={{ height: 180, width: '100%', borderRadius: Radius.xl }} />
          </View>
        )}
      </View>
    );
  }

  const s = santa;
  const joined = s.members.filter((m) => m.status === 'JOINED');
  const invited = s.members.filter((m) => m.status === 'INVITED');
  const isOpen = s.status === 'OPEN';
  const amInvited = s.me?.status === 'INVITED';
  const myList = collections?.find((c) => c.id === s.me?.collection?.id);
  const daysLeft = s.date ? Math.ceil((new Date(s.date).getTime() - now) / DAY) : null;
  const stage = isOpen ? 0 : daysLeft !== null && daysLeft <= 0 ? 2 : 1;

  async function draw() {
    const missing = joined.filter((m) => !m.hasList).length;
    const ok = await confirm(
      'Lancer le tirage ?',
      `${joined.length} participants.${missing ? ` ${missing} n’ont pas encore de liste.` : ''}${invited.length ? ' Les invitations en attente seront annulées.' : ''} Le tirage est définitif.`,
      'Tirer au sort',
      false
    );
    if (!ok) return;
    haptic.success();
    await run(() => drawSanta(s.id), 'Tirage effectué 🎁');
  }

  const menu: MenuItem[][] = [
    isOpen ? [{ label: 'Partager le lien', icon: 'link', onPress: () => void shareSantaLink(s) }] : [],
    s.isOrganizer
      ? [
          {
            label: 'Annuler le Secret Santa',
            icon: 'trash',
            destructive: true,
            onPress: async () => {
              if (await confirm(`Annuler « ${s.name} » ?`, 'Tous les participants seront retirés.', 'Annuler le Secret Santa')) {
                await run(() => deleteSanta(s.id), 'Secret Santa annulé');
                router.back();
              }
            },
          },
        ]
      : isOpen && !amInvited
        ? [
            {
              label: 'Quitter',
              icon: 'rectangle.portrait.and.arrow.right',
              destructive: true,
              onPress: async () => {
                if (await confirm(`Quitter « ${s.name} » ?`, 'Vous pourrez revenir avec le lien tant que le tirage n’a pas eu lieu.', 'Quitter')) {
                  await run(() => leaveSanta(s.id));
                  router.back();
                }
              },
            },
          ]
        : [],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <NavBar right={menu.some((g) => g.length) ? <CollectionMenu groups={menu} /> : undefined} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Space.lg, paddingBottom: insets.bottom + Space.x3, gap: Space.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text2} />}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.hero}>
          <SantaEyebrow />
          <Txt style={styles.heroTitle}>{s.name}</Txt>
          <View style={styles.chips}>
            {!!s.budget && <MetaChip icon={{ ios: 'eurosign', android: 'euro' }} label={`${s.budget}\u00a0€ max`} />}
            {!!s.date && (
              <MetaChip
                icon={{ ios: 'calendar', android: 'event' }}
                label={new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              />
            )}
            {daysLeft !== null && daysLeft > 0 && <MetaChip icon={{ ios: 'hourglass', android: 'hourglass_empty' }} label={`J-${daysLeft}`} gold />}
          </View>
          <View style={styles.heroPeople}>
            <AvatarStack people={joined} max={6} size={34} />
            <Txt variant="footnote" color="text2">
              Organisé par {s.isOrganizer ? 'vous' : (s.organizer.name ?? 'un ami')}
            </Txt>
          </View>
        </Animated.View>

        {/* Stages */}
        <View style={styles.stages}>
          {['Invitations', 'Tirage', 'Échange'].map((label, i) => (
            <View key={label} style={styles.stage}>
              <View style={[styles.stageBar, i <= stage && { backgroundColor: GOLD }]} />
              <Txt variant="micro" style={{ color: i === stage ? Colors.text : Colors.text3 }}>
                {label}
              </Txt>
            </View>
          ))}
        </View>

        {/* Reveal */}
        {s.status === 'DRAWN' && s.assignment && (
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.panel}>
            <Txt variant="subhead" color="text2" center>
              Vous offrez à
            </Txt>
            <Reveal person={s.assignment.user} large />
            {s.assignment.collection ? (
              <Button
                title="Voir sa liste"
                iconRight={Icons.arrowUpRight}
                onPress={() =>
                  router.push({ pathname: '/collection/[id]', params: { id: s.assignment!.collection!.id, name: s.assignment!.collection!.name } })
                }
              />
            ) : (
              <Txt variant="footnote" color="text3" center>
                Pas encore de liste partagée. Elle apparaîtra ici dès qu’elle en choisira une.
              </Txt>
            )}
          </Animated.View>
        )}

        {/* Invitation */}
        {amInvited && (
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.panel}>
            <Txt variant="headline" center>
              {s.organizer.name ?? 'Un ami'} vous invite
            </Txt>
            <Txt variant="subhead" color="text2" center>
              Rejoignez l’échange, puis créez la liste que verra votre Secret Santa.
            </Txt>
            <View style={{ flexDirection: 'row', gap: Space.sm }}>
              <Button
                title="Refuser"
                variant="outline"
                style={{ flex: 1 }}
                onPress={async () => {
                  await run(() => leaveSanta(s.id));
                  router.back();
                }}
              />
              <Button
                title="Participer"
                style={{ flex: 1 }}
                loading={busy}
                onPress={async () => {
                  await run(() => joinSanta(s.id, null));
                  void registerForPush({ ask: true }); // to know when the draw happens
                  router.push({ pathname: '/santa/list', params: { id: s.id } });
                }}
              />
            </View>
          </Animated.View>
        )}

        {/* My list */}
        {!amInvited && s.me && (
          <View style={{ gap: Space.md }}>
            <Txt variant="headline">Ma liste</Txt>
            {s.me.collection ? (
              <Pressable
                onPress={() => router.push({ pathname: '/collection/[id]', params: { id: s.me!.collection!.id, name: s.me!.collection!.name } })}
                style={({ pressed }) => [styles.myList, pressed && { opacity: 0.85 }]}>
                <View style={styles.myListThumbs}>
                  {[0, 1, 2, 3].map((i) => {
                    const uri = myList?.wishes[i]?.imageUrl;
                    return (
                      <View key={i} style={styles.myListThumb}>
                        {uri ? <Image source={thumb(uri, 200)} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
                      </View>
                    );
                  })}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyMedium" numberOfLines={1}>
                    {s.me.collection.name}
                  </Txt>
                  <Txt variant="footnote" color="text2">
                    {myList ? (myList._count.wishes ? `${myList._count.wishes} vœu${myList._count.wishes > 1 ? 'x' : ''}` : 'Vide pour l’instant') : 'Votre liste'} · visible par votre Secret Santa
                  </Txt>
                </View>
                <Icon name={Icons.chevronRight} size={13} color={Colors.text3} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push({ pathname: '/santa/list', params: { id: s.id } })}
                style={({ pressed }) => [styles.emptyList, pressed && { opacity: 0.85 }]}>
                <View style={styles.emptyListIcon}>
                  <Icon name={Icons.plus} size={18} color={GOLD} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyMedium">Créer ma liste</Txt>
                  <Txt variant="footnote" color="text2">
                    Pour que votre Secret Santa sache quoi vous offrir.
                  </Txt>
                </View>
              </Pressable>
            )}
            {s.me.collection && (
              <Pressable
                onPress={() => router.push({ pathname: '/santa/list', params: { id: s.id, importTo: s.me!.collection!.id } })}
                hitSlop={6}
                style={styles.inlineAction}>
                <Icon name={{ ios: 'square.and.arrow.down', android: 'download' }} size={15} color={Colors.text2} />
                <Txt variant="callout" color="text2">
                  Importer des vœux de mes autres listes
                </Txt>
              </Pressable>
            )}
          </View>
        )}

        {/* Participants */}
        <View style={{ gap: Space.md }}>
          <Txt variant="headline">
            {joined.length} participant{joined.length > 1 ? 's' : ''}
            {invited.length ? <Txt color="text3">{`  ·  ${invited.length} invité${invited.length > 1 ? 's' : ''}`}</Txt> : null}
          </Txt>
          <View style={styles.people}>
            {s.members.map((m) => {
              const removable = s.isOrganizer && isOpen && m.id !== user?.id;
              return (
                <Pressable
                  key={m.id}
                  disabled={!removable}
                  onPress={async () => {
                    if (await confirm(`Retirer ${m.name ?? 'ce participant'} ?`, '', 'Retirer')) await run(() => removeFromSanta(s.id, m.id));
                  }}
                  style={[styles.person, m.status === 'INVITED' && { opacity: 0.45 }]}>
                  <View>
                    <View style={[styles.ring, m.hasList && { borderColor: GOLD }]}>
                      <Avatar uri={m.image} name={m.name} size={54} />
                    </View>
                    {m.hasList && (
                      <View style={styles.badge}>
                        <Icon name={Icons.check} size={9} color={Colors.bg} weight="bold" />
                      </View>
                    )}
                  </View>
                  <Txt variant="micro" numberOfLines={1} center style={{ maxWidth: 72 }}>
                    {m.id === user?.id ? 'Vous' : (m.name ?? 'Invité').split(' ')[0]}
                  </Txt>
                </Pressable>
              );
            })}
            {s.isOrganizer && isOpen && (
              <Pressable onPress={() => router.push({ pathname: '/santa/invite', params: { id: s.id } })} style={styles.person}>
                <View style={styles.addPerson}>
                  <Icon name={Icons.plus} size={20} color={Colors.text2} />
                </View>
                <Txt variant="micro" color="text2">
                  Inviter
                </Txt>
              </Pressable>
            )}
          </View>
          {s.isOrganizer && isOpen && (
            <Txt variant="footnote" color="text3">
              Le contour doré indique qui a déjà sa liste. Touchez quelqu’un pour le retirer.
            </Txt>
          )}
        </View>

        {/* Organizer */}
        {s.isOrganizer && isOpen && (
          <View style={{ gap: Space.sm }}>
            <Button title="Lancer le tirage" onPress={draw} loading={busy} disabled={joined.length < 3} />
            <Button title="Partager le lien d’invitation" variant="ghost" icon={Icons.share} onPress={() => void shareSantaLink(s)} />
            <Txt variant="footnote" color="text3" center>
              {joined.length < 3
                ? `Encore ${3 - joined.length} participant${3 - joined.length > 1 ? 's' : ''} minimum avant le tirage.`
                : 'Chacun découvrira à qui il offre. Même vous ne verrez pas les autres paires.'}
            </Txt>
          </View>
        )}
        {!s.isOrganizer && isOpen && !amInvited && (
          <Txt variant="footnote" color="text3" center>
            En attente du tirage par {s.organizer.name ?? 'l’organisateur'}.
          </Txt>
        )}
      </ScrollView>
    </View>
  );
}

function MetaChip({ icon, label, gold }: { icon: IconName; label: string; gold?: boolean }) {
  return (
    <View style={[styles.chip, gold && { backgroundColor: GOLD_SOFT, borderColor: 'rgba(232,200,114,0.35)' }]}>
      <Icon name={icon} size={13} color={gold ? GOLD : Colors.text2} />
      <Txt variant="footnote" style={{ color: gold ? GOLD : Colors.text, fontFamily: Fonts.medium }}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Space.md, paddingTop: Space.md },
  heroTitle: { fontFamily: Fonts.semibold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: Colors.text, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroPeople: { alignItems: 'center', gap: Space.sm, paddingTop: Space.xs },
  stages: { flexDirection: 'row', gap: Space.sm },
  stage: { flex: 1, gap: 6 },
  stageBar: { height: 3, borderRadius: 2, backgroundColor: Colors.muted },
  panel: {
    gap: Space.lg,
    padding: Space.xl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(232,200,114,0.3)',
  },
  myList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  myListThumbs: { width: 56, height: 56, flexDirection: 'row', flexWrap: 'wrap', gap: 2, borderRadius: 12, overflow: 'hidden' },
  myListThumb: { width: 27, height: 27, backgroundColor: Colors.muted, overflow: 'hidden' },
  emptyList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(232,200,114,0.45)',
  },
  emptyListIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD_SOFT },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, alignSelf: 'flex-start' },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.lg },
  person: { alignItems: 'center', gap: 6, width: 64 },
  ring: { padding: 2, borderRadius: 32, borderWidth: 2, borderColor: 'transparent' },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  addPerson: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
