"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { CheckIcon, ChevronDownIcon, LanguagesIcon } from "lucide-react"

import type { SupportedLocale } from "@/lib/locales"
import { SUPPORTED_LOCALES } from "@/lib/locales"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type FooterLocaleDropdownProps = {
  currentLocale: SupportedLocale
  labels: {
    ariaLabel: string
    locales: Record<SupportedLocale, string>
    trigger: string
  }
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

function buildLocalizedPath({
  currentLocale,
  pathname,
  queryString,
  targetLocale,
}: {
  currentLocale: SupportedLocale
  pathname: string
  queryString: string
  targetLocale: SupportedLocale
}): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  const pathSegments = normalizedPath.split("/")
  const currentPathLocale = pathSegments[1] ?? ""

  if (isSupportedLocale(currentPathLocale)) {
    pathSegments[1] = targetLocale
  } else {
    pathSegments.splice(1, 0, currentLocale)
    pathSegments[1] = targetLocale
  }

  const localizedPath = pathSegments.join("/") || `/${targetLocale}/feed`

  if (!queryString) {
    return localizedPath
  }

  return `${localizedPath}?${queryString}`
}

export function FooterLocaleDropdown({
  currentLocale,
  labels,
}: FooterLocaleDropdownProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const safePathname = pathname ?? `/${currentLocale}/feed`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.ariaLabel}
        render={
          <Button
            className="h-auto rounded-none px-2 py-1 text-[10px] tracking-[0.1em] uppercase"
            size="sm"
            variant="outline"
          />
        }
      >
        <LanguagesIcon data-icon="inline-start" />
        {labels.trigger}
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44 rounded-none">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-body text-[10px] tracking-[0.08em] uppercase">
            {labels.trigger}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {SUPPORTED_LOCALES.map((localeOption) => (
            <DropdownMenuItem
              key={`footer-locale-${localeOption}`}
              render={
                <Link
                  className="flex w-full items-center justify-between gap-2"
                  href={buildLocalizedPath({
                    currentLocale,
                    pathname: safePathname,
                    queryString,
                    targetLocale: localeOption,
                  })}
                />
              }
            >
              <span>{labels.locales[localeOption]}</span>
              {localeOption === currentLocale ? <CheckIcon /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
