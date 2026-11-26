import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NewSantaForm } from "@/components/new-santa-form";
import { SeoShell } from "@/components/seo-article";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Créer un Secret Santa",
  robots: { index: false, follow: true },
  alternates: { canonical: "/secret-santa/nouveau" },
};

/** Web creation of a Secret Santa (the app has its own screen): then the invitation page /s/[code]. */
export default async function NewSantaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/signup?callbackUrl=${encodeURIComponent("/secret-santa/nouveau")}`);
  return (
    <SeoShell>
      <NewSantaForm />
    </SeoShell>
  );
}
