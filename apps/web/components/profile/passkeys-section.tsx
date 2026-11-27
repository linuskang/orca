"use client"

import * as React from "react"
import { toast } from "sonner"
import { KeyRound, Loader2, Pencil, Plus, Trash2 } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { formatPasskeyDate, isPasskeyCancelledError } from "@/lib/security"
import {
  ProfileCard,
  ProfileCardContent,
  ProfileCardDescription,
  ProfileCardHeader,
  ProfileCardTitle,
} from "@/components/profile/section-card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
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
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"

type PasskeyRecord = {
  id: string
  name?: string | null
  deviceType: string
  backedUp: boolean
  createdAt?: Date | string | null
}

export function PasskeysSection({
  variant = "default",
}: {
  variant?: "default" | "card"
} = {}) {
  const { data: passkeys, isPending } = authClient.useListPasskeys()
  const [addOpen, setAddOpen] = React.useState(false)
  const [editingPasskey, setEditingPasskey] =
    React.useState<PasskeyRecord | null>(null)
  const [deletingPasskey, setDeletingPasskey] =
    React.useState<PasskeyRecord | null>(null)

  const items = (passkeys as PasskeyRecord[] | null | undefined) ?? []

  const dialogs = (
    <>
      <AddPasskeyDialog open={addOpen} onOpenChange={setAddOpen} />

      <RenamePasskeyDialog
        passkey={editingPasskey}
        onOpenChange={(open) => {
          if (!open) setEditingPasskey(null)
        }}
      />

      <DeletePasskeyDialog
        passkey={deletingPasskey}
        onOpenChange={(open) => {
          if (!open) setDeletingPasskey(null)
        }}
      />
    </>
  )

  if (variant === "card") {
    return (
      <>
        <ProfileCard>
          <ProfileCardHeader>
            <div className="min-w-0">
              <ProfileCardTitle>Passkeys</ProfileCardTitle>
              <ProfileCardDescription>
                Sign in using biometrics or a security key.
              </ProfileCardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setAddOpen(true)}
            >
              <Plus />
              Add passkey
            </Button>
          </ProfileCardHeader>

          {isPending ? (
            <ProfileCardContent>
              <Skeleton className="h-10 w-full rounded-md" />
            </ProfileCardContent>
          ) : items.length > 0 ? (
            <ProfileCardContent className="divide-y divide-inner-border p-0">
              {items.map((passkey) => {
                const addedDate = formatPasskeyDate(passkey.createdAt)
                const deviceLabel = passkey.backedUp
                  ? "Synced"
                  : "Single device"
                const metadata = addedDate
                  ? `${deviceLabel} · Added ${addedDate}`
                  : deviceLabel

                return (
                  <div
                    key={passkey.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <KeyRound className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">
                          {passkey.name || "Passkey"}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {metadata}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Rename ${passkey.name || "passkey"}`}
                        onClick={() => setEditingPasskey(passkey)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${passkey.name || "passkey"}`}
                        onClick={() => setDeletingPasskey(passkey)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </ProfileCardContent>
          ) : (
            <ProfileCardContent>
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <KeyRound className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    No passkeys configured
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Add a passkey to sign in faster without a password.
                  </p>
                </div>
              </div>
            </ProfileCardContent>
          )}
        </ProfileCard>

        {dialogs}
      </>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-sidebar-border px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <KeyRound className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Passkeys</p>
            <p className="text-[11px] text-muted-foreground">
              Sign in using biometrics or a security key.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => setAddOpen(true)}
        >
          <Plus />
          Add passkey
        </Button>
      </div>

      {isPending ? (
        <Skeleton className="h-12 w-full rounded-lg" />
      ) : items.length > 0 ? (
        <div className="space-y-1.5">
          {items.map((passkey) => {
            const addedDate = formatPasskeyDate(passkey.createdAt)
            const deviceLabel = passkey.backedUp ? "Synced" : "Single device"
            const metadata = addedDate
              ? `${deviceLabel} · Added ${addedDate}`
              : deviceLabel

            return (
              <div
                key={passkey.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-sidebar-border bg-card/40 px-3.5 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {passkey.name || "Passkey"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {metadata}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Rename ${passkey.name || "passkey"}`}
                    onClick={() => setEditingPasskey(passkey)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${passkey.name || "passkey"}`}
                    onClick={() => setDeletingPasskey(passkey)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {dialogs}
    </div>
  )
}

function AddPasskeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setName("")
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitting(true)
    setError(null)

    const trimmedName = name.trim()
    const { error: addError } = await authClient.passkey.addPasskey({
      name: trimmedName || undefined,
    })

    setSubmitting(false)

    if (addError) {
      const code = "code" in addError ? addError.code : undefined
      if (isPasskeyCancelledError(code)) {
        return
      }
      setError(addError.message ?? "Failed to register passkey")
      return
    }

    toast.success("Passkey added")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Add a passkey
            </DialogTitle>
            <DialogDescription className="text-xs">
              Give this passkey a name so you can recognize it later, then
              complete the prompt on your device.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="passkey-name" className="text-xs">
              Name (optional)
            </Label>
            <Input
              id="passkey-name"
              placeholder="e.g. MacBook Touch ID"
              autoFocus
              maxLength={64}
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RenamePasskeyDialog({
  passkey,
  onOpenChange,
}: {
  passkey: PasskeyRecord | null
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (passkey) {
      setName(passkey.name ?? "")
      setSubmitting(false)
      setError(null)
    }
  }, [passkey])

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passkey) return

    const trimmed = name.trim()
    if (!trimmed) return

    setSubmitting(true)
    setError(null)

    const { error: updateError } = await authClient.passkey.updatePasskey({
      id: passkey.id,
      name: trimmed,
    })

    setSubmitting(false)

    if (updateError) {
      setError(updateError.message ?? "Failed to rename passkey")
      return
    }

    toast.success("Passkey renamed")
    onOpenChange(false)
  }

  return (
    <Dialog open={Boolean(passkey)} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <form onSubmit={handleRename} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Rename passkey
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update the label used to identify this passkey.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="rename-passkey-input" className="text-xs">
              Name
            </Label>
            <Input
              id="rename-passkey-input"
              autoFocus
              maxLength={64}
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              disabled={submitting || !name.trim()}
            >
              {submitting && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeletePasskeyDialog({
  passkey,
  onOpenChange,
}: {
  passkey: PasskeyRecord | null
  onOpenChange: (open: boolean) => void
}) {
  const [deleting, setDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!passkey) return

    setDeleting(true)
    const { error } = await authClient.passkey.deletePasskey({
      id: passkey.id,
    })
    setDeleting(false)

    if (error) {
      toast.error(error.message ?? "Failed to remove passkey")
      return
    }

    toast.success("Passkey removed")
    onOpenChange(false)
  }

  return (
    <AlertDialog open={Boolean(passkey)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm font-semibold">
            Remove passkey
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">
              {passkey?.name || "this passkey"}
            </span>
            ? You will no longer be able to sign in with it.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel size="sm" disabled={deleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting && <Loader2 className="animate-spin" />}
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
