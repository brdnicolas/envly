import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { Colors } from '@/constants/theme';

export type IconName = { ios: string; android: string };

/** SF Symbol on iOS, Material Symbol on Android. */
export function Icon({ name, size = 20, color = Colors.text, weight = 'regular' }: { name: IconName; size?: number; color?: string; weight?: SymbolViewProps['weight'] }) {
  return (
    <SymbolView
      name={{ ios: name.ios, android: name.android, web: name.android } as SymbolViewProps['name']}
      size={size}
      weight={weight}
      tintColor={color}
    />
  );
}

export const Icons = {
  plus: { ios: 'plus', android: 'add' },
  link: { ios: 'link', android: 'link' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  copy: { ios: 'doc.on.doc', android: 'content_copy' },
  trash: { ios: 'trash', android: 'delete' },
  star: { ios: 'star', android: 'star' },
  starFill: { ios: 'star.fill', android: 'star' },
  arrowUpRight: { ios: 'arrow.up.right', android: 'north_east' },
  lock: { ios: 'lock', android: 'lock' },
  globe: { ios: 'globe', android: 'public' },
  photo: { ios: 'photo', android: 'image' },
  paste: { ios: 'doc.on.clipboard', android: 'content_paste' },
  person: { ios: 'person', android: 'person' },
  people: { ios: 'person.2', android: 'group' },
  check: { ios: 'checkmark', android: 'check' },
  close: { ios: 'xmark', android: 'close' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  pencil: { ios: 'pencil', android: 'edit' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left' },
  gear: { ios: 'gearshape', android: 'settings' },
  hand: { ios: 'hand.raised', android: 'privacy_tip' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  envelope: { ios: 'envelope', android: 'mail' },
  gift: { ios: 'gift', android: 'redeem' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  bell: { ios: 'bell', android: 'notifications' },
  search: { ios: 'magnifyingglass', android: 'search' },
  personAdd: { ios: 'person.badge.plus', android: 'person_add' },
} satisfies Record<string, IconName>;
