import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Installer l’app et l’extension",
  description: "Ajoutez Envly à votre iPhone et à Chrome pour enregistrer une envie en un clic, depuis n’importe quelle boutique.",
  alternates: { canonical: "/install" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
