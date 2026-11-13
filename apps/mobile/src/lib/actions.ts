import { ActionSheetIOS, Alert, Linking, Platform, Share } from 'react-native';

import { invalidate } from '@/hooks/use-api';
import { api, errorMessage, productLink, publicCollectionUrl } from '@/lib/api';
import { haptic } from '@/lib/haptics';

export function confirm(title: string, message: string, confirmLabel: string, destructive = true, cancelLabel = 'Annuler'): Promise<boolean> {
  return new Promise((resolve) => {
    haptic.warning();
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });
}

export type SheetOption = { label: string; destructive?: boolean; onPress: () => void };

/** Native action sheet on iOS, alert-style list on Android. */
export function actionSheet(title: string | undefined, options: SheetOption[]) {
  if (Platform.OS === 'ios') {
    const destructiveIndex = options.findIndex((o) => o.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...options.map((o) => o.label), 'Annuler'],
        cancelButtonIndex: options.length,
        destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
      },
      (i) => options[i]?.onPress()
    );
  } else {
    Alert.alert(title ?? '', undefined, [
      ...options.map((o) => ({ text: o.label, style: o.destructive ? ('destructive' as const) : ('default' as const), onPress: o.onPress })),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  }
}

export function openProduct(url: string) {
  void Linking.openURL(productLink(url));
}

export async function setCollectionPublic(id: string, isPublic: boolean) {
  await api(`/api/collections/${id}`, { method: 'PATCH', body: { isPublic } });
  invalidate('/api/collections');
  haptic.success();
}

export async function deleteCollection(id: string) {
  await api(`/api/collections/${id}`, { method: 'DELETE' });
  invalidate('/api/collections');
  haptic.success();
}

/**
 * Shares a list. Private lists must become public first (asks).
 * Returns true if the list was made public on the way.
 */
export async function shareCollection(c: { id: string; name: string; slug: string; isPublic: boolean }, canPublish: boolean) {
  const share = () =>
    Share.share({ message: `Ma collection « ${c.name} » sur Envly : ${publicCollectionUrl(c.slug)}`, url: publicCollectionUrl(c.slug) });
  if (c.isPublic) {
    await share();
    return false;
  }
  if (!canPublish) {
    Alert.alert('Collection privée', 'Seul le propriétaire peut rendre cette collection publique.');
    return false;
  }
  const ok = await confirm('Partager cette collection ?', 'Elle est privée. Pour la partager, elle doit devenir publique.', 'Rendre publique', false);
  if (!ok) return false;
  try {
    await setCollectionPublic(c.id, true);
    await share();
    return true;
  } catch (e) {
    Alert.alert('Erreur', errorMessage(e));
    return false;
  }
}

export async function updateWish(id: string, patch: Record<string, unknown>) {
  const updated = await api<Record<string, unknown>>(`/api/wishes/${id}`, { method: 'PATCH', body: patch });
  invalidate('/api/collections');
  return updated;
}

export async function deleteWish(id: string) {
  await api(`/api/wishes/${id}`, { method: 'DELETE' });
  invalidate('/api/collections');
  haptic.success();
}
