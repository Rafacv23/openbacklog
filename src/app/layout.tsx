import type { Metadata } from "next";
import { IBM_Plex_Serif, JetBrains_Mono } from "next/font/google";

import { getBaseUrl, SITE_NAME } from "@/lib/site";

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
    default: `${SITE_NAME} | Finish More Games`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "OpenBacklog helps players finish more games with a backlog-first workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark h-full", jetbrainsMono.variable, ibmPlexSerif.variable, "font-sans")}
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
