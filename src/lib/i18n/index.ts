import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";

export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DICTIONARIES = {
  en,
  es,
} as const;

export type Dictionary = (typeof DICTIONARIES)[SupportedLocale];

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function getDictionary(locale: SupportedLocale): Dictionary {
  return DICTIONARIES[locale];
}
