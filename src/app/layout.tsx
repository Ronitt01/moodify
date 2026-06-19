import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Space_Mono } from "next/font/google";
import "./globals.css";

/* Editorial display serif — the emotional, warm voice */
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/* Body sans — readable warmth */
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

/* Mono — the terminal chrome, brackets and labels */
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

const SITE = {
  name: "Moodify",
  title: "Moodify — Music that gets the moment",
  description:
    "Spotify knows what you play. Moodify knows why. The emotional-intelligence layer for Spotify that serves the song that fits where you are, how you feel, and what you need right now.",
  url: "https://moodify.fm",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: "%s — Moodify",
  },
  description: SITE.description,
  applicationName: "Moodify",
  keywords: [
    "Moodify",
    "Delulu FM",
    "Spotify companion",
    "contextual music recommendations",
    "emotional music app",
    "mood music",
    "music recommendation engine",
  ],
  authors: [{ name: "Delulu FM" }],
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230A0A0F'/%3E%3Cpath d='M9 21V11l7 6 7-6v10' fill='none' stroke='%238B7FFF' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="antialiased">
        {/* Skip link for keyboard / screen-reader users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
