"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import { Check, Copy, Loader2, Shield } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { parseTotpSecret } from "@/lib/security"
import { BackupCodesGrid } from "@/components/profile/backup-codes-grid"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { Label } from "@workspace/ui/components/label"

export function TwoFactorSection() {
  const { data: session } = authClient.useSession()
  const isEnabled = Boolean(session?.user?.twoFactorEnabled)
  const email = session?.user?.email

  const [enableOpen, setEnableOpen] = React.useState(false)
  const [regenerateOpen, setRegenerateOpen] = React.useState(false)
  const [disableOpen, setDisableOpen] = React.useState(false)

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-sidebar-border px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Shield className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">
              Two-factor authentication
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isEnabled
                ? "Authenticator app and backup codes are active."
                : "Require a verification code when signing in with a password."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isEnabled ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setRegenerateOpen(true)}
              >
                Backup codes
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-destructive hover:text-destructive"
                onClick={() => setDisableOpen(true)}
              >
                Disable
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setEnableOpen(true)}
            >
              Set up
            </Button>
          )}
        </div>
      </div>

      <EnableTwoFactorDialog
        open={enableOpen}
        onOpenChange={setEnableOpen}
        email={email}
      />
      <RegenerateBackupCodesDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        email={email}
      />
      <DisableTwoFactorDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
      />
    </>
  )
}

type EnableStep = "password" | "verify" | "backup-codes"

function EnableTwoFactorDialog({
  open,
  onOpenChange,
  email,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  email?: string
}) {
  const [step, setStep] = React.useState<EnableStep>("password")
  const [password, setPassword] = React.useState("")
  const [totpURI, setTotpURI] = React.useState("")
  const [backupCodes, setBackupCodes] = React.useState<string[]>([])
  const [code, setCode] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [secretCopied, setSecretCopied] = React.useState(false)
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = React.useCallback(() => {
    setStep("password")
    setPassword("")
    setTotpURI("")
    setBackupCodes([])
    setCode("")
    setSubmitting(false)
    setError(null)
    setSecretCopied(false)
  }, [])

  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const rawSecret = React.useMemo(
    () => (totpURI ? parseTotpSecret(totpURI) : null),
    [totpURI]
  )

  const handleCopySecret = async () => {
    if (!rawSecret) return
    try {
      await navigator.clipboard.writeText(rawSecret)
      setSecretCopied(true)
      toast.success("Setup key copied")
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
      copyTimerRef.current = setTimeout(() => setSecretCopied(false), 2000)
    } catch {
      toast.error("Failed to copy setup key")
    }
  }

  const handleConfirmPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setSubmitting(true)
    setError(null)

    const { data, error: enableError } = await authClient.twoFactor.enable({
      password,
    })

    setSubmitting(false)

    if (enableError) {
      setError(enableError.message ?? "Failed to start 2FA setup")
      return
    }

    if (!data || !("totpURI" in data) || !data.totpURI) {
      setError("Unexpected response from authentication server")
      return
    }

    setTotpURI(data.totpURI)
    setBackupCodes(data.backupCodes ?? [])
    setPassword("")
    setStep("verify")
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return

    setSubmitting(true)
    setError(null)

    const { error: verifyError } = await authClient.twoFactor.verifyTotp({
      code,
    })

    setSubmitting(false)

    if (verifyError) {
      setError(verifyError.message ?? "Invalid verification code")
      setCode("")
      return
    }

    toast.success("Two-factor authentication enabled")
    setStep("backup-codes")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        {step === "password" && (
          <form onSubmit={handleConfirmPassword} className="min-w-0 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Set up two-factor authentication
              </DialogTitle>
              <DialogDescription className="text-xs">
                Confirm your current password to continue.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="enable-2fa-password" className="text-xs">
                Current password
              </Label>
              <Input
                id="enable-2fa-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !password}
              >
                {submitting && <Loader2 className="animate-spin" />}
                Continue
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyCode} className="min-w-0 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Scan QR code
              </DialogTitle>
              <DialogDescription className="text-xs">
                Scan this code with your authenticator app, then enter the
                6-digit code below.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-2.5">
              <div className="rounded-lg border border-border bg-white p-3">
                <QRCodeSVG value={totpURI} size={156} level="M" />
              </div>

              {rawSecret && (
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {secretCopied ? (
                    <>
                      <Check className="size-3" />
                      Copied setup key
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      Manual entry
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <Label htmlFor="verify-totp-code" className="text-xs">
                Verification code
              </Label>
              <InputOTP
                id="verify-totp-code"
                maxLength={6}
                inputMode="numeric"
                pattern="^[0-9]*$"
                autoFocus
                value={code}
                onChange={(value) => setCode(value.replace(/\D/g, ""))}
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
              {error && (
                <p className="text-center text-xs text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || code.length !== 6}
              >
                {submitting && <Loader2 className="animate-spin" />}
                Verify and enable
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "backup-codes" && (
          <div className="min-w-0 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Save your backup codes
              </DialogTitle>
              <DialogDescription className="text-xs">
                Store these single-use codes somewhere safe. You can use them to
                sign in if you lose access to your authenticator app.
              </DialogDescription>
            </DialogHeader>

            <BackupCodesGrid codes={backupCodes} email={email} />

            <DialogFooter>
              <Button
                type="button"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RegenerateBackupCodesDialog({
  open,
  onOpenChange,
  email,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  email?: string
}) {
  const [password, setPassword] = React.useState("")
  const [codes, setCodes] = React.useState<string[] | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setPassword("")
      setCodes(null)
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setSubmitting(true)
    setError(null)

    const { data, error: generateError } =
      await authClient.twoFactor.generateBackupCodes({ password })

    setSubmitting(false)

    if (generateError) {
      setError(generateError.message ?? "Failed to generate backup codes")
      return
    }

    setCodes(data?.backupCodes ?? [])
    setPassword("")
    toast.success("New backup codes generated")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        {codes === null ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Generate new backup codes
              </DialogTitle>
              <DialogDescription className="text-xs">
                Generating a new set of backup codes will invalidate any unused
                previous codes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="regen-backup-password" className="text-xs">
                Current password
              </Label>
              <Input
                id="regen-backup-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !password}
              >
                {submitting && <Loader2 className="animate-spin" />}
                Generate codes
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Your new backup codes
              </DialogTitle>
              <DialogDescription className="text-xs">
                Previous backup codes are no longer valid. Save these in a safe
                place.
              </DialogDescription>
            </DialogHeader>

            <BackupCodesGrid codes={codes} email={email} />

            <DialogFooter>
              <Button
                type="button"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DisableTwoFactorDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [password, setPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setPassword("")
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setSubmitting(true)
    setError(null)

    const { error: disableError } = await authClient.twoFactor.disable({
      password,
    })

    setSubmitting(false)

    if (disableError) {
      setError(disableError.message ?? "Failed to disable 2FA")
      return
    }

    toast.success("Two-factor authentication disabled")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <form onSubmit={handleDisable} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Disable two-factor authentication
            </DialogTitle>
            <DialogDescription className="text-xs">
              Signing in with your password will no longer require a
              verification code. Confirm your password to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="disable-2fa-password" className="text-xs">
              Current password
            </Label>
            <Input
              id="disable-2fa-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={submitting || !password}
            >
              {submitting && <Loader2 className="animate-spin" />}
              Disable 2FA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
