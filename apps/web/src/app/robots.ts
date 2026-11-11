import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/w/", "/u/"],
        // Private or app-only areas: nothing to index there.
        disallow: ["/api/", "/add", "/collection/", "/settings", "/friends", "/dashboard", "/s/", "/reset-password", "/forgot-password"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
