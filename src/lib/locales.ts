import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type SupportedLocale,
} from "@/lib/i18n";

export { SUPPORTED_LOCALES };
export type { SupportedLocale };

export function assertSupportedLocale(locale: string): asserts locale is SupportedLocale {
  if (!isSupportedLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
}

export function toSupportedLocale(locale: string): SupportedLocale | null {
  return isSupportedLocale(locale) ? locale : null;
}
