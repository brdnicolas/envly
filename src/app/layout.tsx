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
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://envly.app"),
  title: "Envly - Shared Wishlists",
  description: "Create and share wishlists with anonymous reservations. Friends and family can reserve gifts without spoiling the surprise.",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Envly - Shared Wishlists",
    description: "Create and share wishlists with anonymous reservations. Friends and family can reserve gifts without spoiling the surprise.",
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
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
