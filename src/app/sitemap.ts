import type { MetadataRoute } from "next";
import { desc, isNotNull } from "drizzle-orm";

import { SUPPORTED_LOCALES } from "@/lib/locales";
import { getBaseUrl } from "@/lib/site";
import { db } from "@/server/db";
import { games, reviews, user } from "@/server/db/schema";

const STATIC_LOCALE_PATHS = [
  "",
  "/changelog",
  "/roadmap",
  "/popular",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

const MAX_SITEMAP_GAMES = 1000;
const MAX_SITEMAP_REVIEWS = 1000;
const MAX_SITEMAP_PROFILES = 1000;

type DynamicPathEntry = {
  changeFrequency: "weekly" | "monthly";
  lastModified: Date;
  path: string;
  priority: number;
};

function getStaticChangeFrequency(path: (typeof STATIC_LOCALE_PATHS)[number]) {
  return path === ""
    ? ("weekly" satisfies NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>)
    : ("monthly" satisfies NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>);
}

async function getDynamicPublicPaths(): Promise<DynamicPathEntry[]> {
  try {
    const [gameRows, reviewRows, profileRows] = await Promise.all([
      db
        .select({
          igdbId: games.igdbId,
          updatedAt: games.updatedAt,
        })
        .from(games)
        .orderBy(desc(games.updatedAt))
        .limit(MAX_SITEMAP_GAMES),
      db
        .select({
          id: reviews.id,
          updatedAt: reviews.updatedAt,
        })
        .from(reviews)
        .orderBy(desc(reviews.updatedAt))
        .limit(MAX_SITEMAP_REVIEWS),
      db
        .select({
          username: user.username,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(isNotNull(user.username))
        .orderBy(desc(user.updatedAt))
        .limit(MAX_SITEMAP_PROFILES),
    ]);

    return [
      ...gameRows.map((row) => ({
        path: `/game/${row.igdbId}`,
        lastModified: row.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...reviewRows.map((row) => ({
        path: `/review/${row.id}`,
        lastModified: row.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...profileRows
        .filter((row): row is { username: string; updatedAt: Date } => Boolean(row.username))
        .map((row) => ({
          path: `/profile/${encodeURIComponent(row.username)}`,
          lastModified: row.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
    ];
  } catch (error) {
    console.error("[sitemap] Failed to resolve dynamic public paths", { error });
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();
  const dynamicPublicPaths = await getDynamicPublicPaths();

  const staticEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) =>
    STATIC_LOCALE_PATHS.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified,
      changeFrequency: getStaticChangeFrequency(path),
      priority: path === "" ? 1 : path === "/popular" ? 0.9 : 0.7,
    })),
  );

  const dynamicEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) =>
    dynamicPublicPaths.map((entry) => ({
      url: `${baseUrl}/${locale}${entry.path}`,
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
  );

  return [...staticEntries, ...dynamicEntries];
}
