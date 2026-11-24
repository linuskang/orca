"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { Label } from "@workspace/ui/components/label"

type VerifyMode = "totp" | "backup"

export default function TwoFactorPage() {
  const router = useRouter()

  const [mode, setMode] = useState<VerifyMode>("totp")
  const [totpCode, setTotpCode] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [trustDevice, setTrustDevice] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  const handleModeChange = (nextMode: VerifyMode) => {
    setMode(nextMode)
    setError(null)
    setSessionExpired(false)
  }

  const handleVerifyError = (err: { code?: string; message?: string }) => {
    if (err.code === "INVALID_TWO_FACTOR_COOKIE") {
      setSessionExpired(true)
      setError("Your sign-in session expired. Please sign in again.")
      return
    }
    setError(err.message ?? "Verification failed. Please try again.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSessionExpired(false)

    if (mode === "totp") {
      if (totpCode.length !== 6) return
      setSubmitting(true)

      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code: totpCode,
        trustDevice,
      })

      setSubmitting(false)

      if (verifyError) {
        handleVerifyError(verifyError)
        setTotpCode("")
        return
      }

      router.push("/dashboard")
      return
    }

    const trimmedBackup = backupCode.trim()
    if (!trimmedBackup) return

    setSubmitting(true)

    const { error: backupError } = await authClient.twoFactor.verifyBackupCode({
      code: trimmedBackup,
      trustDevice,
    })

    setSubmitting(false)

    if (backupError) {
      handleVerifyError(backupError)
      return
    }

    router.push("/dashboard")
  }

  const canSubmit =
    mode === "totp" ? totpCode.length === 6 : backupCode.trim().length > 0

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-sm gap-0 p-0 shadow-md">
        <div className="rounded-b-xl border-b border-inner-border bg-inner-card p-4">
          <h1 className="text-xl font-semibold text-foreground">Orca</h1>
          <p className="mt-1 text-xs text-card-foreground">
            {mode === "totp"
              ? "Enter the 6-digit code from your authenticator app"
              : "Enter one of your single-use backup codes"}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {mode === "totp" ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <Label htmlFor="two-factor-totp" className="sr-only">
                  Verification code
                </Label>
                <InputOTP
                  id="two-factor-totp"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="^[0-9]*$"
                  autoFocus
                  value={totpCode}
                  onChange={(value) => setTotpCode(value.replace(/\D/g, ""))}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="two-factor-backup" className="text-xs">
                  Backup code
                </Label>
                <Input
                  id="two-factor-backup"
                  type="text"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="Enter backup code"
                  className="font-mono text-foreground"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="trust-device"
                checked={trustDevice}
                onCheckedChange={(checked) => setTrustDevice(checked)}
              />
              <Label
                htmlFor="trust-device"
                className="text-xs font-normal text-card-foreground"
              >
                Trust this device for 30 days
              </Label>
            </div>

            {sessionExpired ? (
              <Button
                type="button"
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                Return to sign in
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !canSubmit}
              >
                {submitting && <Loader2 className="animate-spin" />}
                Verify
              </Button>
            )}

            {error && (
              <p className="text-center text-xs text-destructive">{error}</p>
            )}
          </form>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 py-3">
          <p className="text-xs font-medium text-card-foreground">
            {mode === "totp" ? (
              <button
                type="button"
                className="underline"
                onClick={() => handleModeChange("backup")}
              >
                Use a backup code instead
              </button>
            ) : (
              <button
                type="button"
                className="underline"
                onClick={() => handleModeChange("totp")}
              >
                Use authenticator app code
              </button>
            )}
          </p>
          <p className="text-xs font-medium text-card-foreground">
            <Link href="/auth/login" className="underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
