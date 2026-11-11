import type { Metadata } from "next";
import { ExtensionPage } from "@/components/extension-page";
import { EXTENSION_URL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Extension Chrome : ajoutez une envie en un clic",
  description:
    "L’extension Envly ajoute n’importe quel produit à votre liste d’envies depuis Amazon, Zara, Fnac, IKEA… Photo, titre et prix remplis automatiquement. Gratuit, sans publicité.",
  alternates: { canonical: "/extension" },
  openGraph: {
    title: "Extension Envly : ajoutez une envie en un clic",
    description: "Sur n’importe quelle boutique, un clic et le produit est dans votre liste. Gratuit.",
    url: "/extension",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Envly : ajouter à ma wishlist",
  applicationCategory: "BrowserApplication",
  operatingSystem: "Chrome, Edge, Brave, Arc, Opera",
  url: `${SITE_URL}/extension`,
  installUrl: EXTENSION_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  publisher: { "@type": "Organization", name: "Envly", url: SITE_URL },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ExtensionPage />
    </>
  );
}
