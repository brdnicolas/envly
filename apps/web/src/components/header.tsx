"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, LayoutGrid, Settings, LogOut, Puzzle, Users } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { useExtension } from "@/lib/extension";

export function Header() {
  const { data: session } = useSession();
  const extension = useExtension();

  return (
    <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Logo className="h-8 w-auto" />
          Envly
        </Link>

        <div className="flex items-center gap-1.5">
          {session ? (
            <>
              {extension.supported && !extension.installed && (
                <Button variant="outline" size="sm" className="mr-1 hidden h-8 rounded-full border-border/60 px-3 text-xs text-muted-foreground hover:text-foreground md:inline-flex" asChild>
                  <Link href="/extension">
                    <Puzzle className="h-3.5 w-3.5" /> Ajouter l’extension
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" className="rounded-full" asChild>
                <Link href="/friends">
                  <Users className="h-4 w-4" />
                </Link>
              </Button>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      {session.user?.image ? <AvatarImage src={session.user.image} alt={session.user.name || ""} /> : null}
                      <AvatarFallback className="text-xs">
                        {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground text-xs" disabled>
                    <Mail className="h-4 w-4" />
                    {session.user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Mes collections
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/extension" className="flex items-center gap-2">
                      <Puzzle className="h-4 w-4" />
                      Extension Chrome
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex" asChild>
                <Link href="/extension">
                  <Puzzle className="h-4 w-4" /> Extension
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signin">Connexion</Link>
              </Button>
              <Button size="sm" className="rounded-xl" asChild>
                <Link href="/signup">S&apos;inscrire</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
