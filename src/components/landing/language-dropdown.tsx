"use client"

import Link from "next/link"

import { CheckIcon, ChevronDownIcon, LanguagesIcon } from "lucide-react"

import type { SupportedLocale } from "@/lib/locales"

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        render={
          <Button
            className="h-auto gap-1.5 rounded-none px-2 py-1 font-body text-[11px] tracking-[0.08em] uppercase"
            size="sm"
            variant="outline"
          />
        }
      >
        <LanguagesIcon data-icon="inline-start" />
        {currentLocale.toUpperCase()}
        <ChevronDownIcon data-icon="inline-end" />
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
