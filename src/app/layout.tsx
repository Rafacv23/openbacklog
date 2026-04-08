import type { Metadata } from "next";
import { IBM_Plex_Serif, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";

import { getBaseUrl, SITE_NAME } from "@/lib/site";
import { REQUEST_LOCALE_HEADER, toSupportedLocale } from "@/lib/locales";

import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-ibm-plex-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: SITE_NAME,
    template: "%s",
  },
  description:
    "OpenBacklog is a game backlog tracker that helps players decide what to play next and finish more games.",
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const localeFromHeader = requestHeaders.get(REQUEST_LOCALE_HEADER);
  const locale = toSupportedLocale(localeFromHeader ?? "") ?? "en";
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <html
      lang={locale}
      className={cn("dark h-full", jetbrainsMono.variable, ibmPlexSerif.variable, "font-sans")}
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
        {googleAnalyticsId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAnalyticsId}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
