import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à Envly pour retrouver vos listes d’envies, celles de vos proches et vos Secret Santa.",
  alternates: { canonical: "/signin" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
