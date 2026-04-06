import type { ReactNode } from "react";

import { notFound } from "next/navigation";

import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!toSupportedLocale(locale)) {
    notFound();
  }

  return children;
}
