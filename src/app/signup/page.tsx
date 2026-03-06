"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = (val: string) => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (val.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }
    setCheckingUsername(true);
    setUsernameAvailable(null);
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check-slug?slug=${val}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch {
        setUsernameAvailable(null);
      }
      setCheckingUsername(false);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Compte créé mais la connexion a échoué. Veuillez vous connecter manuellement.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm rounded-2xl border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Créer votre compte</CardTitle>
          <CardDescription>Commencez à créer et partager des wishlists</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full rounded-xl" onClick={() => signIn("google", { callbackUrl: "/" })}>
            Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              ou
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Pseudo</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground whitespace-nowrap">envly.fr/</span>
                <div className="relative flex-1">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setUsername(val);
                      checkUsername(val);
                    }}
                    className={cn(
                      "pr-7",
                      usernameAvailable === true && username.length >= 3 && "border-green-500 focus-visible:ring-green-500/30",
                      usernameAvailable === false && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    placeholder="nicolas"
                    minLength={3}
                    maxLength={30}
                  />
                  {username.length >= 3 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {checkingUsername ? (
                        <div className="h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      ) : usernameAvailable === true ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : usernameAvailable === false ? (
                        <X className="h-3.5 w-3.5 text-destructive" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              {username.length >= 3 && usernameAvailable === false && (
                <p className="text-[11px] text-destructive">Ce pseudo est déjà pris</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
                className={cn(
                  confirmPassword && password !== confirmPassword && "border-destructive focus-visible:ring-destructive/30"
                )}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-destructive">Les mots de passe ne correspondent pas</p>
              )}
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Création..." : "Créer un compte"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/signin" className="text-foreground underline underline-offset-4 hover:text-primary">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
