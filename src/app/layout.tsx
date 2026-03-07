import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://envly.fr"),
  title: "Envly",
  description: "Créez vos wishlists, partagez-les et laissez vos proches réserver anonymement.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Envly",
    description: "Créez vos wishlists, partagez-les et laissez vos proches réserver anonymement.",
    type: "website",
    siteName: "Envly",
  },
  twitter: {
    card: "summary_large_image",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
