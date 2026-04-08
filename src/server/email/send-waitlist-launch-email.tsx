import { getBaseUrl } from "@/lib/site"

import { getResendClient, getResendFromEmail } from "./client"
import { WaitlistLaunchAnnouncementEmail } from "./templates/waitlist-launch-announcement-email"

const launchSubject = "OpenBacklog is live. Your waitlist access is ready."

export type SendWaitlistLaunchEmailInput = {
  email: string
}

export async function sendWaitlistLaunchEmail({
  email,
}: SendWaitlistLaunchEmailInput) {
  const resend = getResendClient()
  const appUrl = getBaseUrl()
  const fromEmail = getResendFromEmail()

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: launchSubject,
    react: <WaitlistLaunchAnnouncementEmail appUrl={appUrl} />,
  })
}
