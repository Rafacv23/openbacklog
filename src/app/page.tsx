import { redirect } from "next/navigation";

import { getAuthSession } from "@/server/auth/get-auth-session";

export default async function RootRedirectPage() {
  const session = await getAuthSession();

  if (session) {
    redirect("/app");
  }

  redirect("/en");
}
