export const SITE_NAME = "OpenBacklog";

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000";
}
