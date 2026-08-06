import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import { Providers } from "@/providers";
import "@/app/globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// ─────────────────────────────────────────────────────────────────────────────
// Fonts — loaded via next/font for automatic self-hosting and zero CLS
// ─────────────────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// ─────────────────────────────────────────────────────────────────────────────
// Metadata — SEO for the root layout
// ─────────────────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    template: "%s | ArcadeOS",
    default: "ArcadeOS — Gaming Lounge Management",
  },
  description:
    "Professional gaming lounge management system. Manage stations, sessions, billing and customers from one unified dashboard.",
  keywords: ["gaming lounge", "gaming cafe", "management system", "PS5", "PC gaming"],
  authors: [{ name: "ArcadeOS" }],
  creator: "ArcadeOS",
  robots: {
    index: false, // internal tool — don't index
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b10",
  width: "device-width",
  initialScale: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// Root Layout — Server Component
// All "use client" code is confined to <Providers>
// ─────────────────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", inter.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
