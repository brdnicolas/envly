"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sun, Moon, Monitor, Check, X, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  description: string | null;
  slug: string | null;
}

const themes = [
  { key: "light", label: "Clair", icon: Sun },
  { key: "dark", label: "Sombre", icon: Moon },
  { key: "system", label: "Système", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name || "");
        setSlug(data.slug || "");
        setDescription(data.description || "");
        setImage(data.image || "");
      });
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 5 Mo");
      return;
    }
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: reader.result }),
        });
        const data = await res.json();
        if (res.ok && data.cdnUrl) {
          setImage(data.cdnUrl);
          toast.success("Image téléchargée");
        } else {
          toast.error("Échec du téléchargement");
        }
      } catch {
        toast.error("Upload failed");
      }
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const checkSlug = (val: string) => {
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (val === (profile?.slug || "")) {
      setSlugAvailable(null);
      setCheckingSlug(false);
      return;
    }
    if (val.length < 3) {
      setSlugAvailable(null);
      setCheckingSlug(false);
      return;
    }
    setCheckingSlug(true);
    setSlugAvailable(null);
    slugTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check-slug?slug=${val}`);
        const data = await res.json();
        setSlugAvailable(data.available);
      } catch {
        setSlugAvailable(null);
      }
      setCheckingSlug(false);
    }, 400);
  };

  const handleSave = async () => {
    setSaving(true);
    const body: Record<string, string | null> = { name, description, image };
    if (slug !== (profile?.slug || "")) {
      body.slug = slug;
    }
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setSlugAvailable(null);
      toast.success("Profil mis à jour");
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Échec de la mise à jour du profil");
    }
    setSaving(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const slugChanged = slug !== (profile.slug || "");
  const hasChanges =
    name !== (profile.name || "") ||
    slugChanged ||
    description !== (profile.description || "") ||
    image !== (profile.image || "");
  const slugInvalid = slugChanged && (slug.length < 3 || slugAvailable === false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-semibold mb-8">Paramètres</h1>

        {/* Profile section */}
        <section>
          <h2 className="text-lg font-medium mb-4">Profil</h2>
          <div className="space-y-4">
            {/* Avatar + info */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="relative group"
              >
                <Avatar className="h-16 w-16">
                  {image ? (
                    <AvatarImage src={image} alt={name} />
                  ) : null}
                  <AvatarFallback className="text-xl">
                    {name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingImage ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{name || "Anonyme"}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="text-xs text-destructive hover:underline mt-0.5"
                  >
                    Supprimer la photo
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="slug">Pseudo</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground whitespace-nowrap">envly.fr/u/</span>
                <div className="relative flex-1">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setSlug(val);
                      checkSlug(val);
                    }}
                    className={cn(
                      "pr-7",
                      slugChanged && slugAvailable === true && slug.length >= 3 && "border-green-500 focus-visible:ring-green-500/30",
                      slugChanged && slugAvailable === false && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    placeholder="nicolas"
                    minLength={3}
                    maxLength={30}
                  />
                  {slugChanged && slug.length >= 3 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {checkingSlug ? (
                        <div className="h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      ) : slugAvailable === true ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : slugAvailable === false ? (
                        <X className="h-3.5 w-3.5 text-destructive" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              {slugChanged && slug.length >= 3 && slugAvailable === false && (
                <p className="text-[11px] text-destructive">Ce pseudo est déjà pris</p>
              )}
              {slugChanged && slug.length > 0 && slug.length < 3 && (
                <p className="text-[11px] text-muted-foreground">Le pseudo doit faire au moins 3 caractères</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Bio</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Une courte bio..."
                rows={3}
              />
            </div>

            <Button className="rounded-xl" onClick={handleSave} disabled={saving || !hasChanges || slugInvalid}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Appearance section */}
        <section>
          <h2 className="text-lg font-medium mb-4">Apparence</h2>
          <div className="flex gap-2">
            {themes.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all duration-200",
                  theme === key
                    ? "border-foreground bg-foreground text-background shadow-sm"
                    : "border-border/60 hover:border-foreground/20 hover:shadow-sm"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </section>

        <Separator className="my-8" />

        {/* Danger zone */}
        <section>
          <h2 className="text-lg font-medium mb-4 text-destructive">Zone de danger</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Supprimez définitivement votre compte et toutes vos données. Cette action est irréversible.
          </p>
          <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirm(""); }}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="rounded-xl">Supprimer mon compte</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer le compte</DialogTitle>
                <DialogDescription>
                  Cela supprimera définitivement votre compte, vos collections, vos souhaits et toutes les données associées. Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm">
                  Tapez <strong>SUPPRIMER</strong> pour confirmer
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="SUPPRIMER"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  disabled={deleteConfirm !== "SUPPRIMER" || deleting}
                  onClick={async () => {
                    setDeleting(true);
                    const res = await fetch("/api/account/delete", { method: "DELETE" });
                    if (res.ok) {
                      signOut({ callbackUrl: "/" });
                    } else {
                      toast.error("Échec de la suppression du compte");
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? "Suppression..." : "Supprimer mon compte"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </main>
      <Footer />
    </div>
  );
}
