import { sendLaunchAnnouncementToRegisteredUsers } from "../src/server/pre-registrations/send-launch-announcement"

async function main() {
  const result = await sendLaunchAnnouncementToRegisteredUsers()

  console.log("[launch-email] Summary")
  console.log(`- Eligible users: ${result.totalEligible}`)
  console.log(`- Sent emails: ${result.sent}`)
  console.log(`- Failed emails: ${result.failed}`)

  if (result.failedEmails.length > 0) {
    console.log("- Failed list:")
    result.failedEmails.forEach((email) => {
      console.log(`  - ${email}`)
    })
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error("[launch-email] Fatal error", error)
  process.exit(1)
})
