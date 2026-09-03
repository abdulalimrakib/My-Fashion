import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Integral CF is the SHOP.CO display face. The file shipped in `shop.co/` is a
 * Fontspring *demo*, and demo builds replace most punctuation — and the
 * digit 4 — with a small "DEMO" watermark glyph. Product names such as
 * "T-shirt" would otherwise render that badge instead of a hyphen.
 *
 * `unicode-range` restricts the face to the characters it actually draws, so
 * anything else (hyphens, ampersands, the digit 4) silently falls back to
 * Geist. Swapping in a licensed Integral CF is then a one-line change: drop
 * the `declarations` block.
 */
// Kept inline: `next/font` is statically analysed, so its option values have
// to be literals. The ranges are space, comma, full stop, 0-3, 5-9 (4 is
// watermarked), colon, semicolon, question mark, and A-Z.
const integralCf = localFont({
  src: "./fonts/integral-cf-bold.otf",
  variable: "--font-integral-cf",
  weight: "700",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0020, U+002C, U+002E, U+0030-0033, U+0035-0039, U+003A-003B, U+003F, U+0041-005A",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "SHOP.CO — Find clothes that match your style",
    template: "%s | SHOP.CO",
  },
  description:
    "Browse a diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.",
  openGraph: {
    type: "website",
    siteName: "SHOP.CO",
    title: "SHOP.CO — Find clothes that match your style",
    description:
      "Browse a diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${integralCf.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
