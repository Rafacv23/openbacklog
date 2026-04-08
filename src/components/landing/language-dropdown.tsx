"use client"

import Link from "next/link"

import { CheckIcon, ChevronDownIcon, LanguagesIcon } from "lucide-react"

import type { SupportedLocale } from "@/lib/locales"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type LocaleOption = {
  href: string
  label: string
  locale: SupportedLocale
}

type LanguageDropdownProps = {
  ariaLabel: string
  currentLocale: SupportedLocale
  label: string
  options: readonly LocaleOption[]
}

export function LanguageDropdown({
  ariaLabel,
  currentLocale,
  label,
  options,
}: LanguageDropdownProps) {
  const controlClassName =
    "inline-flex items-center gap-1 rounded-none px-2 py-1 font-body text-[10px] tracking-[0.08em] text-foreground uppercase transition-colors hover:border-primary hover:text-primary lg:gap-2 lg:px-2.5 lg:py-1.5 lg:text-[11px]"
  const badgeClassName =
    "inline-flex items-center gap-1 rounded-none bg-popover px-1.5 py-0.5 text-[10px] text-primary"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        render={
          <button
            className={controlClassName}
            type="button"
          />
        }
      >
        <span className="hidden lg:inline">{label}</span>
        <span className={badgeClassName}>
          <LanguagesIcon className="size-4" />
          <span>{currentLocale.toUpperCase()}</span>
          <ChevronDownIcon className="size-3.5" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-none">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-body text-[10px] tracking-[0.08em] uppercase">
            {label}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.locale}
              render={
                <Link
                  className="flex w-full items-center justify-between gap-2"
                  href={option.href}
                />
              }
            >
              <span>{option.label}</span>
              {option.locale === currentLocale ? <CheckIcon /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
