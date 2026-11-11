import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/icon';
import { CollectionPicker } from '@/components/collection-picker';
import { usePageReader } from '@/components/page-reader';
import { Button, Divider, ErrorText, Field, Skeleton, Txt } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { Colors, Radius, Space } from '@/constants/theme';
import { invalidate, useApi } from '@/hooks/use-api';
import { api, errorMessage, extractUrl } from '@/lib/api';
import { domainOf, parsePriceInput } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { CollectionSummary, ScrapeResult } from '@/lib/types';

export default function AddWishScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ url?: string; collectionId?: string; title?: string; price?: string; images?: string }>();
  const shared = parseShared(params);
  const { data: collections } = useApi<CollectionSummary[]>('/api/collections');

  const [url, setUrl] = useState(params.url ?? '');
  const [title, setTitle] = useState(shared?.title ?? '');
  const [price, setPrice] = useState(shared?.price ?? '');
  const [note, setNote] = useState('');
  const [images, setImages] = useState<string[]>(shared?.images ?? []);
  const [imageUrl, setImageUrl] = useState(shared?.images[0] ?? '');
  const [collectionId, setCollectionId] = useState(params.collectionId ?? '');
  const [scraping, setScraping] = useState(!!params.url && !shared);
  const [showForm, setShowForm] = useState(!!shared);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [clipboardHasUrl, setClipboardHasUrl] = useState(false);
  const lastScraped = useRef('');
  const reader = usePageReader();

  const selectedCollectionId = collectionId || collections?.[0]?.id || '';
  const domain = domainOf(url);

  useEffect(() => {
    if (params.url) return;
    let alive = true;
    (async () => {
      try {
        const has = Platform.OS === 'ios' ? await Clipboard.hasUrlAsync() : !!extractUrl(await Clipboard.getStringAsync());
        if (alive) setClipboardHasUrl(has);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [params.url]);

  function applyProduct(p: { title: string | null; price: number | null; images: string[] }) {
    if (p.title) setTitle(p.title);
    setPrice(p.price != null ? String(p.price).replace('.', ',') : '');
    setImages(p.images.slice(0, 12));
    setImageUrl(p.images[0] ?? '');
    setNotice(null);
  }

  /**
   * Reads the product two ways at once and keeps the first usable answer:
   * on the phone (hidden WebView, works on Amazon & co) and on our server.
   */
  async function fetchProduct(clean: string) {
    let settled = false;
    const take = (p: { title: string | null; price: number | null; images: string[] } | null) => {
      if (settled || !p?.title) return false;
      settled = true;
      applyProduct(p);
      return true;
    };
    const fromServer = api<ScrapeResult>('/api/scrape', { method: 'POST', body: { url: clean } })
      .then((r) => {
        const list = r.imageUrl && !r.images.includes(r.imageUrl) ? [r.imageUrl, ...r.images] : r.images;
        return { title: r.title, price: r.price, images: list };
      })
      .catch(() => null);
    const fromDevice = reader.read(clean);

    // Device usually wins on blocked sites; server is faster elsewhere.
    const first = await Promise.race([fromDevice, fromServer]);
    if (!take(first)) {
      const [device, server] = await Promise.all([fromDevice, fromServer]);
      if (!take(device) && !take(server)) {
        setNotice('Impossible de récupérer les infos de cette page. Complétez-les manuellement.');
      }
    }
    // Keep the device result if it arrives later with a price the server lacked.
    void fromDevice.then((d) => {
      if (d?.price != null) setPrice((cur) => cur || String(d.price).replace('.', ','));
      if (d?.images.length) setImages((cur) => (cur.length ? cur : d.images.slice(0, 12)));
    });

    setUrl(clean);
    setShowForm(true);
    setScraping(false);
  }

  function scrape(input: string) {
    const clean = extractUrl(input);
    if (!clean) return setError('Lien invalide.');
    if (clean === lastScraped.current) return;
    lastScraped.current = clean;
    setError(null);
    setScraping(true);
    setClipboardHasUrl(false);
    void fetchProduct(clean);
  }

  useEffect(() => {
    const clean = extractUrl(params.url);
    if (!clean) return;
    lastScraped.current = clean;
    // Shared from Safari with product data already extracted: no server round-trip needed.
    if (parseShared(params)) return;
    const t = setTimeout(() => void fetchProduct(clean), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.url]);

  async function paste() {
    try {
      const found = extractUrl(await Clipboard.getStringAsync());
      if (found) scrape(found);
      else setError('Aucun lien dans le presse-papier.');
    } catch {
      setError('Impossible de lire le presse-papier.');
    }
  }

  async function save() {
    setError(null);
    if (!title.trim()) return setError('Le titre est requis.');
    if (!selectedCollectionId) return setError('Choisissez une collection.');
    setSaving(true);
    try {
      await api('/api/wishes', {
        method: 'POST',
        body: {
          title: title.trim(),
          url: url.trim() || null,
          description: note.trim() || null,
          imageUrl: imageUrl || null,
          price: parsePriceInput(price),
          collectionId: selectedCollectionId,
        },
      });
      invalidate('/api/collections');
      haptic.success();
      toast('Souhait ajouté');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {reader.element}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 70 }}>
          <Txt variant="bodyMedium" color="text2">
            Annuler
          </Txt>
        </Pressable>
        <Txt variant="headline">Nouveau souhait</Txt>
        <View style={{ width: 70 }} />
      </View>
      <Divider />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 56 : 0}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={styles.content}>
          <Field
            label="Lien du produit"
            value={url}
            onChangeText={(v) => {
              setUrl(v);
              setError(null);
            }}
            placeholder="https://"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={() => scrape(url)}
            onEndEditing={() => url && scrape(url)}
            right={
              scraping ? (
                <ActivityIndicator color={Colors.text2} />
              ) : (
                <Pressable onPress={paste} hitSlop={8} style={styles.paste}>
                  <Txt variant="caption">Coller</Txt>
                </Pressable>
              )
            }
          />

          {clipboardHasUrl && !showForm && (
            <Pressable onPress={paste} style={({ pressed }) => [styles.clipboard, pressed && { opacity: 0.6 }]}>
              <Icon name={Icons.paste} size={16} color={Colors.text2} />
              <Txt variant="callout" style={{ flex: 1 }}>
                Utiliser le lien copié
              </Txt>
              <Icon name={Icons.chevronRight} size={13} color={Colors.text3} />
            </Pressable>
          )}

          {!showForm && !scraping && (
            <View style={{ gap: Space.lg }}>
              <Txt variant="footnote" color="text3">
                Astuce : depuis Safari ou l’app d’une boutique, touchez Partager puis Envly.
              </Txt>
              <Pressable onPress={() => setShowForm(true)} hitSlop={6}>
                <Txt variant="callout" color="text2">
                  Ajouter sans lien →
                </Txt>
              </Pressable>
            </View>
          )}

          {scraping && (
            <View style={{ gap: Space.md }}>
              <View style={{ flexDirection: 'row', gap: Space.sm }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} style={{ width: 96, height: 96, borderRadius: Radius.md }} />
                ))}
              </View>
              <Skeleton style={{ height: 48 }} />
              <Skeleton style={{ height: 48 }} />
            </View>
          )}

          {showForm && !scraping && (
            <Animated.View entering={FadeIn.duration(200)} style={{ gap: Space.xl }}>
              {notice && (
                <View style={styles.notice}>
                  <Txt variant="footnote" color="text2">
                    {notice}
                  </Txt>
                </View>
              )}

              {images.length > 0 && (
                <View style={{ gap: Space.sm }}>
                  <Txt variant="callout">Image</Txt>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.sm }}>
                    {images.map((img) => {
                      const selected = img === imageUrl;
                      return (
                        <Pressable
                          key={img}
                          onPress={() => {
                            haptic.select();
                            setImageUrl(img);
                          }}
                          style={[styles.thumb, { borderColor: selected ? Colors.text : Colors.border }]}>
                          <Image alt="" source={img} style={StyleSheet.absoluteFill} contentFit="cover" />
                          {selected && (
                            <View style={styles.check}>
                              <Icon name={Icons.check} size={11} color={Colors.onPrimary} weight="bold" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  {domain && (
                    <Txt variant="footnote" color="text3">
                      {domain}
                    </Txt>
                  )}
                </View>
              )}

              <Field label="Titre" value={title} onChangeText={setTitle} placeholder="Nom du produit" multiline style={{ minHeight: 0 }} />
              <Field
                label="Prix (optionnel)"
                value={price}
                onChangeText={setPrice}
                placeholder="29,90"
                keyboardType="decimal-pad"
                right={<Txt color="text3">€</Txt>}
              />
              <Field label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Taille, couleur, détails…" multiline />

              <CollectionPicker collections={collections} value={selectedCollectionId} onChange={setCollectionId} />
            </Animated.View>
          )}
          <ErrorText message={error} />
        </ScrollView>

        {showForm && !scraping && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + Space.sm }]}>
            <Button title="Ajouter le souhait" onPress={save} loading={saving} />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.lg, height: 56 },
  content: { padding: Space.lg, paddingBottom: 40, gap: Space.lg },
  paste: { paddingHorizontal: 10, height: 28, borderRadius: Radius.sm, backgroundColor: Colors.muted, justifyContent: 'center' },
  clipboard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notice: { padding: Space.md, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  thumb: { width: 96, height: 96, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 2, backgroundColor: '#FFFFFF' },
  check: { position: 'absolute', right: 6, top: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: Space.lg, paddingTop: Space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, backgroundColor: Colors.bg },
});

/** Product data extracted by the iOS share extension, if any. */
function parseShared(p: { title?: string; price?: string; images?: string }) {
  if (!p.title && !p.price && !p.images) return null;
  let images: string[] = [];
  try {
    const parsed = p.images ? JSON.parse(p.images) : [];
    if (Array.isArray(parsed)) images = parsed.filter((u): u is string => typeof u === 'string');
  } catch {}
  const n = p.price ? Number(p.price) : NaN;
  return { title: p.title ?? '', price: Number.isFinite(n) ? String(n).replace('.', ',') : '', images };
}
