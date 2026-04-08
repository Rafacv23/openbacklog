import { NextResponse } from "next/server"

import { toSupportedLocale } from "@/lib/locales"
import { registerPreRegistration } from "@/server/pre-registrations/register-pre-registration"

type CreatePreRegistrationRequestBody = {
  email?: unknown
  locale?: unknown
}

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: CreatePreRegistrationRequestBody

  try {
    body = (await request.json()) as CreatePreRegistrationRequestBody
  } catch {
    return NextResponse.json({ status: "invalid_email" }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email : ""
  const localeCandidate = typeof body.locale === "string" ? body.locale : "en"
  const locale = toSupportedLocale(localeCandidate) ?? "en"

  try {
    const result = await registerPreRegistration({ email, locale })

    if (result.status === "invalid_email") {
      return NextResponse.json({ status: result.status }, { status: 400 })
    }

    if (result.status === "created") {
      return NextResponse.json({ status: result.status }, { status: 201 })
    }

    if (result.status === "created_email_pending") {
      return NextResponse.json({ status: result.status }, { status: 202 })
    }

    return NextResponse.json({ status: result.status })
  } catch (error) {
    console.error("[waitlist] Failed to create pre-registration", { error })
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
