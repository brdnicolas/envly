import type { Metadata } from "next";
import { GiftIdeas } from "@/components/gift-ideas";
import { discover } from "@/lib/discover";

export const revalidate = 3600;

const TITLE = "Idées cadeaux : les envies les plus populaires du moment";
const DESCRIPTION =
  "Les produits les plus ajoutés aux listes d'envies Envly ces dernières semaines : idées cadeaux pour Noël, un anniversaire ou un Secret Santa, par budget.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Envly` },
  description: DESCRIPTION,
  alternates: { canonical: "/idees-cadeaux" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/idees-cadeaux" },
};

export default async function Page() {
  const items = await discover({ limit: 48 });
  return <GiftIdeas budget={null} items={items} h1="Idées cadeaux populaires" intro="Ce que les gens ajoutent le plus à leurs listes d'envies en ce moment, mis à jour toutes les heures." />;
}
