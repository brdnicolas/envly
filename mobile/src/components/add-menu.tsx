import { Button, Host, Image, Menu } from '@expo/ui/swift-ui';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { Icons } from '@/components/icon';
import { IconButton } from '@/components/primitives';
import { Colors } from '@/constants/theme';
import { actionSheet } from '@/lib/actions';
import { haptic } from '@/lib/haptics';

const addWish = () => {
  haptic.select();
  router.push('/add');
};
const newCollection = () => {
  haptic.select();
  router.push('/new-collection');
};

/** Header "+" that opens a native pull-down menu: add a wish or create a collection. */
export function AddMenu() {
  if (Platform.OS !== 'ios') {
    return (
      <IconButton
        icon={Icons.plus}
        label="Créer"
        onPress={() =>
          actionSheet(undefined, [
            { label: 'Ajouter un souhait', onPress: addWish },
            { label: 'Nouvelle collection', onPress: newCollection },
          ])
        }
      />
    );
  }

  return (
    <Host matchContents style={{ marginHorizontal: 10 }}>
      <Menu label={<Image systemName="plus.app" size={24} color={Colors.text} />}>
        <Button label="Ajouter un souhait" systemImage="gift" onPress={addWish} />
        <Button label="Nouvelle collection" systemImage="rectangle.stack.badge.plus" onPress={newCollection} />
      </Menu>
    </Host>
  );
}
