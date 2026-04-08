import type { MetadataRoute } from "next";

import { SUPPORTED_LOCALES } from "@/lib/locales";
import { getBaseUrl } from "@/lib/site";

const STATIC_LOCALE_PATHS = [
  "",
  "/changelog",
  "/roadmap",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  return SUPPORTED_LOCALES.flatMap((locale) =>
    STATIC_LOCALE_PATHS.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : 0.7,
    })),
  );
}
