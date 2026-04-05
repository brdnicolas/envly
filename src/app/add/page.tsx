"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Check, Gift, Plus, ImagePlus, Globe, Lock, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollections } from "@/hooks/use-data";

interface Collection {
  id: string;
  name: string;
  slug: string;
}

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function WishPreview({
  title,
  url,
  imageUrl,
  price,
}: {
  title: string;
  url: string;
  imageUrl: string;
  price: string;
}) {
  const domain = getDomain(url);
  const hasContent = title || imageUrl || price;

  if (!hasContent) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center p-8 text-center min-h-[280px]">
        <Gift className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground/60">
          Votre souhait apparaîtra ici...
        </p>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm">
      {/* Image */}
      <div className="block overflow-hidden bg-muted/30">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full aspect-[4/3] flex items-center justify-center">
            <span className="text-2xl text-muted-foreground/20">?</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 flex flex-col gap-0.5 flex-1">
        <h3 className="text-xs font-medium leading-tight line-clamp-2">
          {title || "Souhait sans titre"}
        </h3>
        <div className="flex items-center justify-between mt-auto pt-0.5">
          {domain && (
            <span className="text-[10px] text-muted-foreground truncate">
              {domain}
            </span>
          )}
          {price && (
            <span className="text-xs font-semibold tabular-nums ml-auto">
              {parseFloat(price).toFixed(2)}&euro;
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AddPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AddPageContent />
    </Suspense>
  );
}

function AddPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sharedUrl = searchParams.get("url") || searchParams.get("text") || "";
  const preselectedCollectionId = searchParams.get("collectionId") || "";
  const fromExtension = searchParams.get("from") === "extension";

  const { data: swrCollections, isLoading: loadingCollections, mutate: mutateCollections } = useCollections();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [collectionsInitialized, setCollectionsInitialized] = useState(false);

  const extensionImages = (() => {
    try {
      const raw = searchParams.get("images");
      if (fromExtension && raw) return JSON.parse(raw) as string[];
    } catch {}
    return [] as string[];
  })();

  const [url, setUrl] = useState(sharedUrl);
  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState(extensionImages[0] || "");
  const [price, setPrice] = useState(fromExtension ? (searchParams.get("price") || "") : "");
  const [images, setImages] = useState<string[]>(extensionImages);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionPublic, setNewCollectionPublic] = useState(false);
  const [collectionQuery, setCollectionQuery] = useState("");
  const [collectionOpen, setCollectionOpen] = useState(false);
  const collectionRef = useRef<HTMLDivElement>(null);

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(collectionQuery.toLowerCase())
  );
  const exactMatch = collections.some(
    (c) => c.name.toLowerCase() === collectionQuery.toLowerCase()
  );
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  // Sync SWR data to local state for mutations (create collection)
  useEffect(() => {
    if (swrCollections && !collectionsInitialized) {
      setCollections(swrCollections);
      if (preselectedCollectionId && swrCollections.some((c) => c.id === preselectedCollectionId)) {
        setSelectedCollectionId(preselectedCollectionId);
      } else if (swrCollections.length > 0) {
        setSelectedCollectionId(swrCollections[0].id);
      }
      setCollectionsInitialized(true);
    }
  }, [swrCollections, collectionsInitialized, preselectedCollectionId]);

  // Scrape URL
  const scrapeUrl = useCallback(async (targetUrl: string) => {
    if (!targetUrl) return;
    try {
      new URL(targetUrl);
    } catch {
      return;
    }

    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        const bestImage = data.imageUrl || data.images?.[0] || "";
        const imgList: string[] = data.images || [];
        if (bestImage && !imgList.includes(bestImage)) {
          imgList.unshift(bestImage);
        }
        if (imgList.length) setImages(imgList);
        if (bestImage) setImageUrl(bestImage);
        if (data.price) setPrice(String(data.price));
        toast.success("Informations chargées !");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Impossible de récupérer les infos de cette URL");
      }
    } catch {
      toast.error("Échec du chargement de l'URL");
    }
    setScraping(false);
  }, []);

  // Auto-scrape on mount if URL provided (always scrape server-side, even from extension)
  useEffect(() => {
    if (sharedUrl) {
      scrapeUrl(sharedUrl);
    }
  }, [sharedUrl, scrapeUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { compressImage } = await import("@/lib/compress-image");
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed, "image.webp");
      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { cdnUrl } = await res.json();
        setImageUrl(cdnUrl);
        setImages((prev) => [cdnUrl, ...prev]);
        toast.success("Image téléchargée !");
      } else {
        toast.error("Échec du téléchargement de l'image");
      }
    } catch {
      toast.error("Échec du téléchargement de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCollection = async () => {
    const name = collectionQuery.trim();
    if (!name) return;
    setCreatingCollection(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isPublic: newCollectionPublic }),
      });
      if (res.ok) {
        const created = await res.json();
        setCollections((prev) => [...prev, created]);
        setSelectedCollectionId(created.id);
        setCollectionQuery("");
        setCollectionOpen(false);
        toast.success(`Collection « ${name} » créée !`);
      } else {
        toast.error("Échec de la création de la collection");
      }
    } catch {
      toast.error("Failed to create collection");
    }
    setCreatingCollection(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (collectionRef.current && !collectionRef.current.contains(e.target as Node)) {
        setCollectionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCollectionId) {
      toast.error("Veuillez sélectionner une collection");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        url: url || null,
        imageUrl: imageUrl || null,
        price: price || null,
        collectionId: selectedCollectionId,
      }),
    });

    if (res.ok) {
      if (fromExtension) {
        window.close();
        return;
      }
      toast.success("Souhait ajouté !");
      router.push(`/collection/${selectedCollectionId}`);
    } else {
      toast.error("Échec de l'ajout du souhait");
    }
    setSaving(false);
  };

  if (loadingCollections) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <p className="text-muted-foreground text-center">
          Vous devez avoir au moins une collection pour ajouter un souhait.
        </p>
        <Button onClick={() => router.push("/")}>
          Aller au tableau de bord
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Ajouter un souhait</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enregistrez cet article dans l&apos;une de vos collections.
          </p>
        </div>

        {!fromExtension && (
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-5 py-4 mb-6">
            <div className="h-9 w-9 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
              <Puzzle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Astuce :</span> <a href="https://chromewebstore.google.com/detail/nfchfkcbbiedjgiebgfhlkondnekfdjp" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground transition-colors">Installez notre extension Chrome</a> pour ajouter des souhaits directement depuis n&apos;importe quel site.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="url">URL</Label>
              <div className="relative">
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted) {
                      try {
                        new URL(pasted);
                        setTimeout(() => scrapeUrl(pasted), 0);
                      } catch {}
                    }
                  }}
                  placeholder="https://..."
                />
                {scraping && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="space-y-1.5">
              <Label>Image</Label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto rounded-xl border border-border/60 p-2 [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
                {images.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setImageUrl(img)}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border-2 transition-all hover:opacity-90",
                      imageUrl === img
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent"
                    )}
                  >
                    <img
                      src={img}
                      alt=""
                      className="block w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                      }}
                    />
                    {imageUrl === img && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
                <label
                  className={cn(
                    "relative aspect-square rounded-md overflow-hidden border-2 border-dashed border-border transition-all hover:border-primary/50 cursor-pointer flex items-center justify-center",
                    uploading && "pointer-events-none opacity-60"
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  )}
                </label>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Que souhaitez-vous ?"
                required
              />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Note personnelle (optionnel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Taille, couleur, détails..."
                rows={2}
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label htmlFor="price">Prix (optionnel)</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                type="number"
                step="0.01"
              />
            </div>

            {/* Collection selector */}
            <div className="space-y-1.5">
              <Label htmlFor="collection">Collection</Label>
              <div ref={collectionRef} className="relative">
                <Input
                  id="collection"
                  value={collectionOpen ? collectionQuery : (selectedCollection?.name || "")}
                  onChange={(e) => {
                    setCollectionQuery(e.target.value);
                    setCollectionOpen(true);
                  }}
                  onFocus={() => {
                    setCollectionQuery("");
                    setCollectionOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && collectionOpen) {
                      e.preventDefault();
                      if (filteredCollections.length === 1) {
                        setSelectedCollectionId(filteredCollections[0].id);
                        setCollectionQuery("");
                        setCollectionOpen(false);
                      } else if (collectionQuery.trim() && !exactMatch) {
                        handleCreateCollection();
                      }
                    }
                    if (e.key === "Escape") {
                      setCollectionOpen(false);
                    }
                  }}
                  placeholder="Rechercher ou créer..."
                  autoComplete="off"
                />
                {collectionOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredCollections.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                          c.id === selectedCollectionId && "bg-accent"
                        )}
                        onClick={() => {
                          setSelectedCollectionId(c.id);
                          setCollectionQuery("");
                          setCollectionOpen(false);
                        }}
                      >
                        {c.id === selectedCollectionId && <Check className="h-3.5 w-3.5 shrink-0" />}
                        <span className={c.id === selectedCollectionId ? "" : "pl-5.5"}>{c.name}</span>
                      </button>
                    ))}
                    {collectionQuery.trim() && !exactMatch && (
                      <div className="border-t border-border px-3 py-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="flex flex-1 items-center gap-2 text-sm hover:text-foreground transition-colors text-left text-muted-foreground"
                            onClick={handleCreateCollection}
                            disabled={creatingCollection}
                          >
                            {creatingCollection ? (
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5 shrink-0" />
                            )}
                            Créer &laquo; {collectionQuery.trim()} &raquo;
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewCollectionPublic(!newCollectionPublic)}
                            className={cn(
                              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors border",
                              newCollectionPublic
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {newCollectionPublic ? (
                              <><Globe className="h-3 w-3" /> Public</>
                            ) : (
                              <><Lock className="h-3 w-3" /> Private</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {filteredCollections.length === 0 && !collectionQuery.trim() && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Aucune collection</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full rounded-xl" disabled={saving}>
              {saving ? "Ajout..." : "Ajouter le souhait"}
            </Button>
          </form>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-20">
            <p className="text-xs font-medium text-muted-foreground mb-2">Aperçu</p>
            <div className="w-full max-w-[220px] mx-auto lg:max-w-none">
              <WishPreview
                title={title}
                url={url}
                imageUrl={imageUrl}
                price={price}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
