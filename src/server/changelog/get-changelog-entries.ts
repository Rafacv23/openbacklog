import { promises as fs } from "node:fs"
import path from "node:path"

import { marked } from "marked"

import type { SupportedLocale } from "@/lib/locales"

type ChangelogFrontmatter = {
  version?: string
  date?: string
  title?: string
  summary?: string
}

export type ChangelogEntry = {
  slug: string
  version: string
  date: string
  title: string
  summary: string
  contentHtml: string
}

const CHANGELOG_ROOT = path.resolve("content", "changelog")

export async function getChangelogEntries(
  locale: SupportedLocale,
): Promise<ChangelogEntry[]> {
  const localizedEntries = await loadEntriesForLocale(locale)

  if (localizedEntries.length > 0 || locale === "en") {
    return localizedEntries
  }

  return loadEntriesForLocale("en")
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function loadEntriesForLocale(locale: SupportedLocale): Promise<ChangelogEntry[]> {
  const directory = path.join(CHANGELOG_ROOT, locale)

  if (!(await exists(directory))) {
    return []
  }

  const files = await fs.readdir(directory, { withFileTypes: true })
  const markdownFiles = files
    .filter((file) => file.isFile() && file.name.endsWith(".md"))
    .map((file) => file.name)

  const entries = await Promise.all(
    markdownFiles.map(async (fileName) => {
      const filePath = path.join(directory, fileName)
      const source = await fs.readFile(filePath, "utf8")
      const { frontmatter, body } = parseMarkdown(source)
      const slug = fileName.replace(/\.md$/i, "")
      const version = normalizeVersion(frontmatter.version ?? slug)
      const title = frontmatter.title?.trim() || `Version ${version}`
      const summary = frontmatter.summary?.trim() || extractSummary(body)
      const date = frontmatter.date?.trim() || ""
      const contentHtml = await renderMarkdown(body)

      return {
        slug,
        version,
        date,
        title,
        summary,
        contentHtml,
      } satisfies ChangelogEntry
    }),
  )

  return sortEntries(entries)
}

async function renderMarkdown(markdown: string): Promise<string> {
  const rendered = marked.parse(markdown, {
    async: false,
    gfm: true,
  })

  return typeof rendered === "string" ? rendered : await rendered
}

function parseMarkdown(source: string): {
  frontmatter: ChangelogFrontmatter
  body: string
} {
  const normalized = source.replace(/\r\n/g, "\n")

  if (!normalized.startsWith("---\n")) {
    return {
      frontmatter: {},
      body: normalized.trim(),
    }
  }

  const frontmatterEnd = normalized.indexOf("\n---\n", 4)

  if (frontmatterEnd === -1) {
    return {
      frontmatter: {},
      body: normalized.trim(),
    }
  }

  const rawFrontmatter = normalized.slice(4, frontmatterEnd)
  const body = normalized.slice(frontmatterEnd + 5).trim()

  return {
    frontmatter: parseFrontmatterBlock(rawFrontmatter),
    body,
  }
}

function parseFrontmatterBlock(rawBlock: string): ChangelogFrontmatter {
  const frontmatter: ChangelogFrontmatter = {}
  const allowedKeys = new Set<keyof ChangelogFrontmatter>([
    "version",
    "date",
    "title",
    "summary",
  ])

  for (const line of rawBlock.split("\n")) {
    const separatorIndex = line.indexOf(":")

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim() as keyof ChangelogFrontmatter

    if (!allowedKeys.has(key)) {
      continue
    }

    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1")

    if (!value) {
      continue
    }

    frontmatter[key] = value
  }

  return frontmatter
}

function extractSummary(markdown: string): string {
  for (const line of markdown.split("\n")) {
    const content = line.trim()

    if (!content) {
      continue
    }

    if (
      content.startsWith("#") ||
      content.startsWith("- ") ||
      content.startsWith("* ") ||
      /^\d+\.\s/.test(content) ||
      content.startsWith("```")
    ) {
      continue
    }

    return content.replace(/[*_`]/g, "")
  }

  return ""
}

function normalizeVersion(value: string): string {
  return value.trim().replace(/^v/i, "") || "0.0.0"
}

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function sortEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
  return entries.sort((a, b) => {
    const dateDiff = toTimestamp(b.date) - toTimestamp(a.date)

    if (dateDiff !== 0) {
      return dateDiff
    }

    return compareVersionsDesc(a.version, b.version)
  })
}

function compareVersionsDesc(versionA: string, versionB: string): number {
  const [aMajor, aMinor, aPatch] = parseVersion(versionA)
  const [bMajor, bMinor, bPatch] = parseVersion(versionB)

  if (aMajor !== bMajor) {
    return bMajor - aMajor
  }

  if (aMinor !== bMinor) {
    return bMinor - aMinor
  }

  return bPatch - aPatch
}

function parseVersion(version: string): [number, number, number] {
  const [major = "0", minor = "0", patch = "0"] = version
    .replace(/^v/i, "")
    .split(".")

  return [
    Number.parseInt(major, 10) || 0,
    Number.parseInt(minor, 10) || 0,
    Number.parseInt(patch, 10) || 0,
  ]
}
