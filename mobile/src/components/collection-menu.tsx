import { Button, Divider, Host, Image, Menu } from '@expo/ui/swift-ui';
import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { Icons } from '@/components/icon';
import { IconButton } from '@/components/primitives';
import { Colors } from '@/constants/theme';
import { actionSheet } from '@/lib/actions';

export type MenuItem = {
  label: string;
  /** SF Symbol */
  icon: string;
  onPress: () => void;
  destructive?: boolean;
};

/** The actions of a collection, grouped: edit · share · visibility · delete. Owner-only items are dropped for others. */
export function collectionActions(
  c: { isPublic: boolean },
  isOwner: boolean,
  h: { edit: () => void; share: () => void; copyLink?: () => void; togglePublic: () => void; remove: () => void }
): MenuItem[][] {
  return [
    isOwner ? [{ label: 'Modifier', icon: 'pencil', onPress: h.edit }] : [],
    [
      { label: 'Partager', icon: 'square.and.arrow.up', onPress: h.share },
      ...(h.copyLink && c.isPublic ? [{ label: 'Copier le lien', icon: 'link', onPress: h.copyLink }] : []),
    ],
    isOwner
      ? [
          c.isPublic
            ? { label: 'Rendre privée', icon: 'lock', onPress: h.togglePublic }
            : { label: 'Rendre publique', icon: 'globe', onPress: h.togglePublic },
        ]
      : [],
    isOwner ? [{ label: 'Supprimer', icon: 'trash', destructive: true, onPress: h.remove }] : [],
  ];
}

/**
 * "…" button that opens a native pull-down menu anchored to it (iOS),
 * like Photos or Notes. Groups are separated by a divider.
 */
export function CollectionMenu({ groups, size = 36 }: { groups: MenuItem[][]; size?: number }) {
  const visible = groups.filter((g) => g.length > 0);

  if (Platform.OS !== 'ios') {
    return (
      <IconButton
        icon={Icons.more}
        label="Options"
        size={size}
        onPress={() => actionSheet(undefined, visible.flat().map((i) => ({ label: i.label, destructive: i.destructive, onPress: i.onPress })))}
      />
    );
  }

  return (
    // Claim the touch so it never reaches a parent Pressable/Link (the card would open).
    <View
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Host matchContents>
        <Menu label={<Image systemName="ellipsis" size={Math.round(size * 0.5)} color={Colors.text} />}>
          {visible.map((group, gi) => [
            gi > 0 ? <Divider key={`d${gi}`} /> : null,
            ...group.map((item) => (
              <Button
                key={item.label}
                label={item.label}
                systemImage={item.icon as never}
                role={item.destructive ? 'destructive' : undefined}
                onPress={item.onPress}
              />
            )),
          ])}
        </Menu>
      </Host>
    </View>
  );
}

/** Open the edit sheet for a collection. */
export function editCollection(c: { id: string; name: string; description: string | null; isPublic: boolean }) {
  router.push({
    pathname: '/new-collection',
    params: { id: c.id, name: c.name, description: c.description ?? '', isPublic: String(c.isPublic) },
  });
}
