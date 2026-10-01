import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";

import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast";
import { appUrl } from "@/lib/flags";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const displaySerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "EventBuddy — Config India 2026",
    template: "%s · EventBuddy",
  },
  description: "Find the ones you came to meet, before the doors open.",
  applicationName: "EventBuddy",
  openGraph: {
    title: "EventBuddy — Config India 2026",
    description: "Find the ones you came to meet, before the doors open.",
    url: appUrl,
    siteName: "EventBuddy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventBuddy — Config India 2026",
    description: "Find the ones you came to meet, before the doors open.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a090d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${displaySerif.variable}`}>
      <body>
        <ToastProvider>
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
