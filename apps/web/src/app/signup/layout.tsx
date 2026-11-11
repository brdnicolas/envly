import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte gratuit",
  description:
    "Créez votre liste d’envies en 30 secondes : ajoutez des cadeaux depuis n’importe quel site, partagez-la, vos proches réservent en secret.",
  alternates: { canonical: "/signup" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
