import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { Avatar, Button, Field, Txt } from '@/components/primitives';
import { Sheet, useSheet } from '@/components/sheet';
import { Colors, Radius, Space } from '@/constants/theme';
import { api, API_URL, errorMessage, publicProfileUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';
import { setFollowing } from '@/lib/social';
import type { UserSearchResult } from '@/lib/types';

/** Bottom sheet: find people by name or email and follow them in place. */
function SearchContent() {
  const { close } = useSheet();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounced search: one request per pause in typing.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      setSearching(true);
      api<UserSearchResult[]>(`/api/users/search?q=${encodeURIComponent(term)}`)
        .then((r) => !cancelled && setResults(r))
        .catch(() => {})
        .finally(() => !cancelled && setSearching(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const shown = q.trim().length < 2 ? [] : results;

  async function toggle(u: UserSearchResult) {
    haptic.select();
    const follow = !u.isFollowing;
    setResults((rs) => rs.map((r) => (r.id === u.id ? { ...r, isFollowing: follow } : r)));
    try {
      await setFollowing(u.id, follow);
      if (follow) haptic.success();
    } catch (e) {
      setResults((rs) => rs.map((r) => (r.id === u.id ? { ...r, isFollowing: !follow } : r)));
      Alert.alert('Erreur', errorMessage(e));
    }
  }

  function open(u: UserSearchResult) {
    close();
    router.push({ pathname: '/user/[id]', params: { id: u.id, name: u.name ?? '', image: u.image ?? '' } });
  }

  const invite = () =>
    void Share.share({
      message: 'Je partage mes envies sur Envly, rejoins-moi pour voir ma liste (et faire la tienne) :',
      url: user?.slug ? publicProfileUrl(user.slug) : API_URL,
    });

  return (
    <View style={{ paddingBottom: Space.lg }}>
      <View style={styles.head}>
        <Txt variant="title2">Trouver des amis</Txt>
      </View>
      <View style={{ paddingHorizontal: Space.lg }}>
        <Field
          value={q}
          onChangeText={setQ}
          placeholder="Nom ou e-mail"
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          right={searching ? <ActivityIndicator color={Colors.text3} /> : <Icon name={Icons.search} size={16} color={Colors.text3} />}
        />
      </View>

      <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingVertical: Space.sm }}>
        {shown.map((u) => (
          <Pressable key={u.id} onPress={() => open(u)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.card }]}>
            <Avatar uri={u.image} name={u.name} size={44} />
            <Txt variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
              {u.name ?? 'Utilisateur'}
            </Txt>
            <Button
              title={u.isFollowing ? 'Abonné' : 'Suivre'}
              size="sm"
              variant={u.isFollowing ? 'secondary' : 'primary'}
              onPress={() => void toggle(u)}
            />
          </Pressable>
        ))}
        {q.trim().length >= 2 && !searching && shown.length === 0 && (
          <Txt variant="subhead" color="text3" center style={{ padding: Space.xl }}>
            Personne ne correspond à « {q.trim()} ».
          </Txt>
        )}
      </ScrollView>

      {/* Invite: friends who aren't on Envly yet */}
      <Pressable onPress={invite} style={({ pressed }) => [styles.invite, pressed && { opacity: 0.7 }]}>
        <View style={styles.inviteIcon}>
          <Icon name={Icons.share} size={16} color={Colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyMedium">Inviter des amis</Txt>
          <Txt variant="footnote" color="text2">
            Envoyez-leur le lien de votre profil.
          </Txt>
        </View>
        <Icon name={Icons.chevronRight} size={13} color={Colors.text3} />
      </Pressable>
    </View>
  );
}

export default function FriendsSearchSheet() {
  return (
    <Sheet maxHeight="88%">
      <SearchContent />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: Space.lg, paddingTop: Space.sm, paddingBottom: Space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.lg, paddingVertical: Space.sm },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    marginHorizontal: Space.lg,
    marginTop: Space.sm,
    padding: Space.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  inviteIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.muted },
});
