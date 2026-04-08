export const SITE_NAME = "OpenBacklog";
export const DEFAULT_SOCIAL_IMAGE_PATH =
  "/images/elden-ring-cover-2079746590.webp";

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000";
}

export function getDefaultSocialImageUrl(): string {
  return new URL(DEFAULT_SOCIAL_IMAGE_PATH, getBaseUrl()).toString();
}
