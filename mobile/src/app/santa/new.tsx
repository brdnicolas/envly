import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { Avatar, Button, ErrorText, IconButton, Txt } from '@/components/primitives';
import { SantaEyebrow } from '@/components/santa';
import { Colors, Fonts, Radius, Space, Type } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { registerForPush } from '@/lib/push';
import { createSanta } from '@/lib/santa';
import type { Person } from '@/lib/types';

const GOLD = '#E8C872';
const STEPS = 4;
const NAME_IDEAS = ['🎄 Noël en famille', '🎁 Noël entre amis', '🏢 Secret Santa du bureau', '🥂 Réveillon'];
const BUDGETS = [10, 20, 30, 50, 100];

/** Step-by-step creation: name → budget → friends → date. */
export default function NewSantaFlow() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState<number | null>(30);
  const [customBudget, setCustomBudget] = useState('');
  const [picked, setPicked] = useState<Person[]>([]);
  const [date, setDate] = useState(() => new Date(new Date().getFullYear(), 11, 24));
  const [noDate, setNoDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = step === 0 ? !!name.trim() : true;

  function next() {
    if (!canContinue) return;
    haptic.select();
    if (step < STEPS - 1) setStep(step + 1);
    else void create();
  }
  function back() {
    if (step === 0) router.back();
    else setStep(step - 1);
  }

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const custom = parseInt(customBudget.replace(/\D/g, ''), 10);
      const santa = await createSanta({
        name: name.trim(),
        budget: customBudget ? (custom > 0 ? custom : null) : budget,
        date: noDate ? null : date.toISOString(),
        collectionId: null,
        userIds: picked.map((p) => p.id),
      });
      haptic.success();
      void registerForPush({ ask: true }); // to hear when friends join and when it's drawn
      router.replace({ pathname: '/santa/list', params: { id: santa.id, welcome: '1' } });
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  const cta =
    step === STEPS - 1
      ? 'Créer le Secret Santa'
      : step === 2 && !picked.length
        ? 'Passer'
        : step === 2
          ? `Inviter ${picked.length} ami${picked.length > 1 ? 's' : ''}`
          : 'Continuer';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + Space.xs }]}>
        <IconButton icon={step === 0 ? Icons.close : Icons.chevronLeft} label={step === 0 ? 'Fermer' : 'Retour'} onPress={back} />
        <View style={styles.progress}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={[styles.segment, i <= step && styles.segmentOn]} />
          ))}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View key={step} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={{ flex: 1 }}>
        {step === 0 && <NameStep name={name} setName={setName} onSubmit={next} />}
        {step === 1 && (
          <BudgetStep budget={budget} setBudget={setBudget} custom={customBudget} setCustom={setCustomBudget} />
        )}
        {step === 2 && <FriendsStep picked={picked} setPicked={setPicked} />}
        {step === 3 && <DateStep date={date} setDate={setDate} noDate={noDate} setNoDate={setNoDate} />}
      </Animated.View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Space.sm }]}>
        <ErrorText message={error} />
        <Button title={cta} onPress={next} loading={saving} disabled={!canContinue} />
      </View>
    </KeyboardAvoidingView>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: Space.sm }}>
      <SantaEyebrow />
      <Txt style={styles.title}>{title}</Txt>
      {!!subtitle && (
        <Txt variant="body" color="text2">
          {subtitle}
        </Txt>
      )}
    </View>
  );
}

function NameStep({ name, setName, onSubmit }: { name: string; setName: (v: string) => void; onSubmit: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.step} keyboardShouldPersistTaps="handled">
      <StepTitle title="Comment s’appelle votre Secret Santa ?" />
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Noël en famille"
        placeholderTextColor={Colors.text3}
        selectionColor={GOLD}
        keyboardAppearance="dark"
        autoFocus
        returnKeyType="next"
        onSubmitEditing={onSubmit}
        maxLength={80}
        style={styles.bigInput}
      />
      <View style={styles.chips}>
        {NAME_IDEAS.map((idea) => (
          <Pressable
            key={idea}
            onPress={() => {
              haptic.select();
              setName(idea);
            }}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
            <Txt variant="callout">{idea}</Txt>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function BudgetStep({
  budget,
  setBudget,
  custom,
  setCustom,
}: {
  budget: number | null;
  setBudget: (v: number | null) => void;
  custom: string;
  setCustom: (v: string) => void;
}) {
  const { width } = useWindowDimensions();
  const tile = { width: (width - Space.xl * 2 - Space.md * 2) / 3, height: 72 };
  const pick = (v: number | null) => {
    haptic.select();
    setCustom('');
    setBudget(v);
  };
  return (
    <ScrollView contentContainerStyle={styles.step} keyboardShouldPersistTaps="handled">
      <StepTitle title="Quel budget par cadeau ?" subtitle="Tout le monde joue à armes égales." />
      <View style={styles.budgetGrid}>
        {BUDGETS.map((b) => {
          const on = !custom && budget === b;
          return (
            <Pressable key={b} onPress={() => pick(b)} style={[styles.budget, tile, on && styles.budgetOn]}>
              <Txt style={[styles.budgetValue, on && { color: Colors.bg }]}>{b} €</Txt>
            </Pressable>
          );
        })}
        <Pressable onPress={() => pick(null)} style={[styles.budget, tile, !custom && budget === null && styles.budgetOn]}>
          <Txt variant="bodyMedium" style={!custom && budget === null ? { color: Colors.bg } : undefined}>
            Libre
          </Txt>
        </Pressable>
      </View>
      <View style={[styles.customBudget, !!custom && { borderColor: Colors.text }]}>
        <TextInput
          value={custom}
          onChangeText={(v) => setCustom(v.replace(/\D/g, '').slice(0, 4))}
          placeholder="Autre montant"
          placeholderTextColor={Colors.text3}
          keyboardType="number-pad"
          keyboardAppearance="dark"
          selectionColor={GOLD}
          style={[Type.body, { flex: 1, color: Colors.text }]}
        />
        <Txt color="text3">€</Txt>
      </View>
    </ScrollView>
  );
}

function FriendsStep({ picked, setPicked }: { picked: Person[]; setPicked: (p: Person[]) => void }) {
  const { data: following } = useApi<Person[]>('/api/follows/me?tab=following');
  const { data: followers } = useApi<Person[]>('/api/follows/me?tab=followers');
  const [query, setQuery] = useState('');

  const people: Person[] = [];
  for (const p of [...(following ?? []), ...(followers ?? [])]) if (!people.some((x) => x.id === p.id)) people.push(p);
  const q = query.trim().toLowerCase();
  const shown = q ? people.filter((p) => (p.name ?? '').toLowerCase().includes(q)) : people;
  const isOn = (id: string) => picked.some((p) => p.id === id);
  const toggle = (p: Person) => {
    haptic.select();
    setPicked(isOn(p.id) ? picked.filter((x) => x.id !== p.id) : [...picked, p]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.step, { paddingBottom: Space.md }]}>
        <StepTitle title="Qui participe ?" subtitle="Ils recevront une invitation. Vous pourrez aussi partager un lien ensuite." />
        <View style={styles.search}>
          <Icon name={{ ios: 'magnifyingglass', android: 'search' }} size={15} color={Colors.text3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher"
            placeholderTextColor={Colors.text3}
            keyboardAppearance="dark"
            autoCorrect={false}
            style={[Type.body, { flex: 1, color: Colors.text, paddingVertical: 0 }]}
          />
        </View>
        {picked.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.md }}>
            {picked.map((p) => (
              <Animated.View key={p.id} entering={FadeIn.duration(150)} layout={LinearTransition}>
                <Pressable onPress={() => toggle(p)} style={styles.pickedItem} accessibilityLabel={`Retirer ${p.name ?? ''}`}>
                  <View>
                    <Avatar uri={p.image} name={p.name} size={52} />
                    <View style={styles.pickedX}>
                      <Icon name={Icons.close} size={9} color={Colors.bg} weight="bold" />
                    </View>
                  </View>
                  <Txt variant="micro" numberOfLines={1} style={{ maxWidth: 60 }}>
                    {(p.name ?? '').split(' ')[0]}
                  </Txt>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </View>
      <FlatList
        data={shown}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <Txt color="text3" center style={{ padding: Space.xl }}>
            {following && followers ? 'Aucun ami trouvé. Vous pourrez partager un lien d’invitation.' : 'Chargement…'}
          </Txt>
        }
        renderItem={({ item }) => {
          const on = isOn(item.id);
          return (
            <Pressable onPress={() => toggle(item)} style={({ pressed }) => [styles.person, pressed && { backgroundColor: Colors.card }]}>
              <Avatar uri={item.image} name={item.name} size={44} />
              <Txt variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                {item.name ?? 'Utilisateur'}
              </Txt>
              <View style={[styles.check, on && styles.checkOn]}>{on && <Icon name={Icons.check} size={13} color={Colors.bg} weight="bold" />}</View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function DateStep({
  date,
  setDate,
  noDate,
  setNoDate,
}: {
  date: Date;
  setDate: (d: Date) => void;
  noDate: boolean;
  setNoDate: (v: boolean) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.step}>
      <StepTitle title="Quand a lieu l’échange ?" subtitle="Pour que chacun ait son cadeau à temps." />
      {Platform.OS === 'ios' && (
        <View style={[styles.calendar, noDate && { opacity: 0.35 }]} pointerEvents={noDate ? 'none' : 'auto'}>
          <Host matchContents>
            <DatePicker
              selection={date}
              displayedComponents={['date']}
              range={{ start: new Date() }}
              onDateChange={setDate}
              modifiers={[datePickerStyle('graphical'), tint(GOLD)]}
            />
          </Host>
        </View>
      )}
      <Pressable
        onPress={() => {
          haptic.select();
          setNoDate(!noDate);
        }}
        style={styles.noDate}>
        <View style={[styles.check, noDate && styles.checkOn]}>{noDate && <Icon name={Icons.check} size={13} color={Colors.bg} weight="bold" />}</View>
        <Txt variant="bodyMedium">Pas encore de date</Txt>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.xs, gap: Space.sm },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.muted },
  segmentOn: { backgroundColor: GOLD },
  step: { paddingHorizontal: Space.xl, paddingTop: Space.xl, gap: Space.xl },
  title: { fontFamily: Fonts.semibold, fontSize: 30, lineHeight: 36, color: Colors.text, letterSpacing: -0.4 },
  bigInput: { fontFamily: Fonts.medium, fontSize: 26, color: Colors.text, paddingVertical: Space.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderStrong },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  budget: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetOn: { backgroundColor: GOLD, borderColor: GOLD },
  budgetValue: { fontFamily: Fonts.semibold, fontSize: 22, lineHeight: 28, color: Colors.text },
  customBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    height: 52,
    paddingHorizontal: Space.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  search: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, height: 42, paddingHorizontal: 12, borderRadius: Radius.md, backgroundColor: Colors.card },
  pickedItem: { alignItems: 'center', gap: 4 },
  pickedX: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  person: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.xl, paddingVertical: 8 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: GOLD, borderColor: GOLD },
  calendar: { borderRadius: Radius.xl, backgroundColor: Colors.card, padding: Space.sm, alignItems: 'center' },
  noDate: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  bottom: { paddingHorizontal: Space.xl, paddingTop: Space.md, gap: Space.sm },
});
