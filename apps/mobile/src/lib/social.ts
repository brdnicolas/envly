import { Alert } from 'react-native';

import { invalidate } from '@/hooks/use-api';
import { actionSheet, confirm } from '@/lib/actions';
import { api, errorMessage } from '@/lib/api';
import { firstName } from '@/lib/format';
import { haptic } from '@/lib/haptics';

function refreshSocial() {
  invalidate('/api/friends');
  invalidate('/api/users/');
  invalidate('/api/follows/me');
  invalidate('/api/blocks');
}

/** Follow / unfollow someone, then refresh every screen that shows follow state. */
export async function setFollowing(userId: string, follow: boolean) {
  await api('/api/follows/users', { method: follow ? 'POST' : 'DELETE', body: { userId } });
  refreshSocial();
}

const REASONS = [
  { key: 'inappropriate', label: 'Contenu inapproprié' },
  { key: 'spam', label: 'Spam ou arnaque' },
  { key: 'harassment', label: 'Harcèlement' },
  { key: 'impersonation', label: "Usurpation d'identité" },
  { key: 'other', label: 'Autre' },
] as const;

/**
 * Report a user (or one of their lists): pick a reason, it goes to the Envly team, then offer to block.
 * `onBlocked` runs if the user chose to block right after reporting.
 */
export function reportUser(target: { userId: string; name: string | null; collectionId?: string }, onBlocked?: () => void) {
  actionSheet(
    target.collectionId ? 'Signaler cette liste' : `Signaler ${firstName(target.name) || 'cet utilisateur'}`,
    REASONS.map((r) => ({
      label: r.label,
      onPress: async () => {
        try {
          await api('/api/reports', {
            method: 'POST',
            body: { userId: target.userId, collectionId: target.collectionId, reason: r.key },
          });
          haptic.success();
          Alert.alert('Merci pour votre signalement', 'Notre équipe l’examine sous 24 heures. Voulez-vous aussi bloquer cette personne ?', [
            { text: 'Non merci', style: 'cancel' },
            { text: 'Bloquer', style: 'destructive', onPress: () => void blockUser(target, true).then((ok) => ok && onBlocked?.()) },
          ]);
        } catch (e) {
          Alert.alert('Erreur', errorMessage(e));
        }
      },
    }))
  );
}

/** Block someone (asks first unless `skipConfirm`). Resolves true when blocked. */
export async function blockUser(target: { userId: string; name: string | null }, skipConfirm = false) {
  const who = firstName(target.name) || 'Cette personne';
  if (!skipConfirm) {
    const ok = await confirm(
      `Bloquer ${who} ?`,
      'Vous ne vous suivrez plus, et elle ne pourra plus voir votre profil ni vos listes dans l’app. Vous pourrez la débloquer depuis votre Compte.',
      'Bloquer'
    );
    if (!ok) return false;
  }
  try {
    await api('/api/blocks', { method: 'POST', body: { userId: target.userId } });
    haptic.success();
    refreshSocial();
    return true;
  } catch (e) {
    Alert.alert('Erreur', errorMessage(e));
    return false;
  }
}

export async function unblockUser(userId: string) {
  await api('/api/blocks', { method: 'DELETE', body: { userId } });
  refreshSocial();
}
