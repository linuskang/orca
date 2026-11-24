export function parseTotpSecret(totpURI: string): string | null {
  try {
    const parsed = new URL(totpURI)
    return parsed.searchParams.get("secret")
  } catch {
    return null
  }
}

export function downloadBackupCodes(codes: string[], email?: string): void {
  const header = [
    "Orca Two-Factor Authentication Backup Codes",
    email ? `Account: ${email}` : null,
    `Generated: ${new Date().toISOString()}`,
    "",
    "Each code can only be used once. Store them in a safe place.",
    "",
  ]
    .filter((line): line is string => line !== null)
    .join("\n")

  const content = `${header}${codes.join("\n")}\n`
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = "orca-backup-codes.txt"
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const PASSKEY_CANCELLED_CODES = new Set([
  "AUTH_CANCELLED",
  "REGISTRATION_CANCELLED",
  "ERROR_CEREMONY_ABORTED",
])

export function isPasskeyCancelledError(code?: string): boolean {
  return typeof code === "string" && PASSKEY_CANCELLED_CODES.has(code)
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function formatPasskeyDate(date?: Date | string | null): string | null {
  if (!date) return null
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return null
  return dateFormatter.format(parsed)
}
