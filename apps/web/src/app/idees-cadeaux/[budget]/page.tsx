import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiftIdeas } from "@/components/gift-ideas";
import { BUDGETS, discover, isBudget } from "@/lib/discover";

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ budget: string }> };

export function generateStaticParams() {
  return Object.keys(BUDGETS).map((budget) => ({ budget }));
}

const copy = (label: string) => ({
  h1: `Idées cadeaux ${label.toLowerCase()}`,
  title: `Idées cadeaux ${label.toLowerCase()} : les plus populaires`,
  description: `Idées cadeaux ${label.toLowerCase()} pour Noël, un anniversaire ou un Secret Santa : les produits les plus ajoutés aux listes d'envies Envly.`,
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { budget } = await params;
  if (!isBudget(budget)) return {};
  const c = copy(BUDGETS[budget].label);
  return {
    title: { absolute: `${c.title} · Envly` },
    description: c.description,
    alternates: { canonical: `/idees-cadeaux/${budget}` },
    openGraph: { title: c.title, description: c.description, url: `/idees-cadeaux/${budget}` },
  };
}

export default async function Page({ params }: Props) {
  const { budget } = await params;
  if (!isBudget(budget)) notFound();
  const items = await discover({ budget, limit: 48 });
  const c = copy(BUDGETS[budget].label);
  return (
    <GiftIdeas
      budget={budget}
      items={items}
      h1={c.h1}
      intro={`Les envies ${BUDGETS[budget].label.toLowerCase()} les plus populaires sur Envly : parfait pour un Secret Santa ou un petit cadeau.`}
    />
  );
}
