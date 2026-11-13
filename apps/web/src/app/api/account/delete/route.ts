import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Permanently deletes the signed-in account (everything cascades).
 * The client must send { confirm: "SUPPRIMER" }: the word the user typed, so a stray request can't wipe an account.
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { confirm } = await req.json().catch(() => ({}));
  if (typeof confirm !== "string" || confirm.trim().toUpperCase() !== "SUPPRIMER") {
    return NextResponse.json({ error: "Tapez SUPPRIMER pour confirmer la suppression." }, { status: 400 });
  }

  await prisma.user.delete({
    where: { id: (session.user as { id: string }).id },
  });

  return NextResponse.json({ message: "Account deleted" });
}
