import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LandingPage } from "@/components/landing-page";
import { DashboardLoader } from "@/components/dashboard-loader";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const HOME_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon-512.png` },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, inLanguage: "fr-FR", publisher: { "@id": `${SITE_URL}/#org` } },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web, iOS, Chrome",
      inLanguage: "fr-FR",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
  ],
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    return <DashboardLoader />;
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_LD) }} />
      <LandingPage />
    </>
  );
}
