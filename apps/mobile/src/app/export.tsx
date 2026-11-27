import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/icon';
import { Txt } from '@/components/primitives';
import { Sheet, useSheet } from '@/components/sheet';
import { Colors, Radius, Space } from '@/constants/theme';
import { exportMyData } from '@/lib/actions';

const OPTIONS = [
  { format: 'json' as const, title: 'JSON', subtitle: 'Réimportable sur Envly' },
  { format: 'csv' as const, title: 'CSV', subtitle: 'Pour Excel ou Numbers' },
];

/** Export all my lists: pick a format, then the share sheet (Files, Mail…). */
function ExportContent() {
  const { close } = useSheet();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(format: 'json' | 'csv') {
    setBusy(format);
    await exportMyData(format);
    setBusy(null);
    close();
  }

  return (
    <View style={styles.container}>
      <View style={{ gap: Space.xs }}>
        <Txt variant="title2">Exporter mes listes</Txt>
        <Txt variant="subhead" color="text2">
          Toutes vos listes et vos envies. Les réservations de vos proches ne sont jamais incluses.
        </Txt>
      </View>
      {OPTIONS.map((o) => (
        <Pressable
          key={o.format}
          disabled={!!busy}
          onPress={() => void run(o.format)}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.elevated }, busy === o.format && { opacity: 0.6 }]}>
          <View style={styles.icon}>
            <Icon name={Icons.download} size={18} color={Colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyMedium">{o.title}</Txt>
            <Txt variant="footnote" color="text3">
              {busy === o.format ? 'Préparation…' : o.subtitle}
            </Txt>
          </View>
          <Icon name={Icons.chevronRight} size={13} color={Colors.text3} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Space.xl, paddingTop: Space.sm, paddingBottom: Space.md, gap: Space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.muted },
});

export default function ExportScreen() {
  return (
    <Sheet>
      <ExportContent />
    </Sheet>
  );
}
