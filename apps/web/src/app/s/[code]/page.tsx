import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SantaView } from "@/components/santa-view";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadSanta, serializeSanta } from "@/lib/secret-santa";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const s = await prisma.secretSanta.findUnique({
    where: { inviteCode: code },
    select: { name: true, organizer: { select: { name: true } } },
  });
  if (!s) return {};
  const title = `Secret Santa « ${s.name} »`;
  const description = `${s.organizer.name ?? "Un ami"} vous invite à participer sur Envly.`;
  return { title, description, robots: { index: false, follow: false }, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

/** Invite link landing: join (with a list), then follow the draw and see who you give to. */
export default async function SantaPage({ params }: Props) {
  const { code } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent(`/s/${code}`)}`);

  const found = await prisma.secretSanta.findUnique({ where: { inviteCode: code }, select: { id: true } });
  if (!found) notFound();
  const santa = (await loadSanta(found.id))!;

  const [initial, collections] = await Promise.all([
    serializeSanta(santa, session.user.id),
    prisma.collection.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-10">
        <SantaView code={code} initial={initial} collections={collections} userId={session.user.id} />
      </main>
      <Footer />
    </div>
  );
}
