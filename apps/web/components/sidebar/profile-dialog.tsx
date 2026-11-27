"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  Check,
  Laptop,
  Loader2,
  Monitor,
  Moon,
  Sun,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { PasskeysSection } from "@/components/profile/passkeys-section"
import { TwoFactorSection } from "@/components/profile/two-factor-section"
import { cn } from "@workspace/ui/lib/utils"
import { createForm, useForm } from "@workspace/ui/components/form"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"

type SessionRecord = {
  id: string
  token: string
  userAgent?: string | null
  ipAddress?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

function getInitial(name: string, email: string) {
  const source = name.trim() || email.trim()
  return source ? source[0]!.toUpperCase() : "?"
}

function parseUserAgent(ua?: string | null) {
  if (!ua) return "Unknown device"
  const browser = ua.includes("Edg")
    ? "Edge"
    : ua.includes("Chrome")
      ? "Chrome"
      : ua.includes("Firefox")
        ? "Firefox"
        : ua.includes("Safari")
          ? "Safari"
          : "Browser"
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac OS")
      ? "macOS"
      : ua.includes("Linux")
        ? "Linux"
        : ua.includes("Android")
          ? "Android"
          : ua.includes("iPhone") || ua.includes("iPad")
            ? "iOS"
            : "Unknown OS"
  return `${browser} on ${os}`
}

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-xl">
        <div className="shrink-0 border-b border-sidebar-border px-6 py-4 pr-12">
          <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">
            Profile
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
            Manage your account details, security, and preferences.
          </DialogDescription>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <ProfileSection />
          <Separator />
          <SecuritySection />
          <Separator />
          <SessionsSection open={open} />
          <Separator />
          <AppearanceSection />
          <Separator />
          <NotificationsSection />
        </div>
      </DialogContent>
    </Dialog>
  )
}

type ProfileFormData = {
  name: string
}

type SecurityFormData = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const ProfileForm = createForm<ProfileFormData>()
const SecurityForm = createForm<SecurityFormData>()

function ProfileSection() {
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [saving, setSaving] = React.useState(false)

  const form = useForm<ProfileFormData>({
    values: {
      name: user?.name ?? "",
    },
  })

  if (!user) return null

  const initial = getInitial(user.name, user.email)
  const watchedName = form.watch("name")
  const isDirty =
    watchedName !== undefined &&
    watchedName.trim() !== "" &&
    watchedName.trim() !== user.name

  const handleSave = async (data: ProfileFormData) => {
    const trimmed = data.name.trim()
    if (!trimmed || trimmed === user.name) return

    setSaving(true)
    const { error } = await authClient.updateUser({
      name: trimmed,
    })
    setSaving(false)

    if (error) {
      toast.error(error.message ?? "Failed to update profile")
      return
    }

    toast.success("Profile updated")
  }

  return (
    <ProfileForm form={form} onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center gap-3.5">
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback className="text-sm">{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ProfileForm.Item name="name">
          <div className="space-y-1.5">
            <ProfileForm.Label className="text-xs">
              Display name
            </ProfileForm.Label>
            <ProfileForm.Field
              required
              rules={{
                validate: (value) =>
                  value.trim().length > 0 || "Name cannot be empty",
              }}
            >
              <Input placeholder="Your name" />
            </ProfileForm.Field>
            <ProfileForm.Error className="text-xs text-destructive" />
          </div>
        </ProfileForm.Item>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="account-email" className="text-xs">
              Email address
            </Label>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {user.emailVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>
          <Input id="account-email" value={user.email} disabled />
        </div>
      </div>

      <div className="flex justify-end">
        <ProfileForm.Submit asChild pending={saving}>
          <Button type="submit" size="sm" disabled={!isDirty || saving}>
            {saving && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </ProfileForm.Submit>
      </div>
    </ProfileForm>
  )
}

function SecuritySection() {
  const [saving, setSaving] = React.useState(false)

  const form = useForm<SecurityFormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const [currentPassword, newPassword, confirmPassword] = form.watch([
    "currentPassword",
    "newPassword",
    "confirmPassword",
  ])
  const canSubmit = Boolean(currentPassword && newPassword && confirmPassword)

  const handlePasswordChange = async (data: SecurityFormData) => {
    setSaving(true)
    const { error } = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    })
    setSaving(false)

    if (error) {
      toast.error(error.message ?? "Failed to change password")
      return
    }

    form.reset()
    toast.success("Password updated")
  }

  return (
    <div className="space-y-5">
      <SecurityForm
        form={form}
        onSubmit={handlePasswordChange}
        className="space-y-3.5"
      >
        <div>
          <h4 className="text-xs font-semibold text-foreground">Security</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Updating your password will sign out other active sessions.
          </p>
        </div>

        <div className="space-y-3">
          <SecurityForm.Item name="currentPassword">
            <div className="space-y-1.5">
              <SecurityForm.Label className="text-xs">
                Current password
              </SecurityForm.Label>
              <SecurityForm.Field required>
                <Input type="password" autoComplete="current-password" />
              </SecurityForm.Field>
              <SecurityForm.Error className="text-xs text-destructive" />
            </div>
          </SecurityForm.Item>

          <div className="grid gap-3 sm:grid-cols-2">
            <SecurityForm.Item name="newPassword">
              <div className="space-y-1.5">
                <SecurityForm.Label className="text-xs">
                  New password
                </SecurityForm.Label>
                <SecurityForm.Field
                  required
                  rules={{
                    minLength: {
                      value: 8,
                      message: "New password must be at least 8 characters",
                    },
                    deps: ["confirmPassword"],
                  }}
                >
                  <Input type="password" autoComplete="new-password" />
                </SecurityForm.Field>
                <SecurityForm.Error className="text-xs text-destructive" />
              </div>
            </SecurityForm.Item>

            <SecurityForm.Item name="confirmPassword">
              <div className="space-y-1.5">
                <SecurityForm.Label className="text-xs">
                  Confirm password
                </SecurityForm.Label>
                <SecurityForm.Field
                  required
                  rules={{
                    validate: (value, formValues) =>
                      value === formValues.newPassword ||
                      "Passwords do not match",
                  }}
                >
                  <Input type="password" autoComplete="new-password" />
                </SecurityForm.Field>
                <SecurityForm.Error className="text-xs text-destructive" />
              </div>
            </SecurityForm.Item>
          </div>
        </div>

        <div className="flex justify-end">
          <SecurityForm.Submit asChild pending={saving}>
            <Button
              type="submit"
              size="sm"
              disabled={saving || !canSubmit}
            >
              {saving && <Loader2 className="animate-spin" />}
              Update password
            </Button>
          </SecurityForm.Submit>
        </div>
      </SecurityForm>

      <div className="space-y-2.5">
        <TwoFactorSection />
        <PasskeysSection />
      </div>
    </div>
  )
}

function SessionsSection({ open }: { open: boolean }) {
  const { data: currentSession } = authClient.useSession()
  const [sessions, setSessions] = React.useState<SessionRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [revokingToken, setRevokingToken] = React.useState<string | null>(null)
  const [revokingAll, setRevokingAll] = React.useState(false)

  const loadSessions = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await authClient.listSessions()
    setLoading(false)
    if (error) {
      toast.error(error.message ?? "Failed to load sessions")
      return
    }
    setSessions((data as SessionRecord[]) ?? [])
  }, [])

  React.useEffect(() => {
    if (open) {
      void loadSessions()
    }
  }, [open, loadSessions])

  const currentToken = currentSession?.session?.token
  const otherSessionsCount = sessions.filter(
    (s) => s.token !== currentToken
  ).length

  const handleRevoke = async (token: string) => {
    setRevokingToken(token)
    const { error } = await authClient.revokeSession({ token })
    setRevokingToken(null)
    if (error) {
      toast.error(error.message ?? "Failed to revoke session")
      return
    }
    setSessions((prev) => prev.filter((s) => s.token !== token))
    toast.success("Session revoked")
  }

  const handleRevokeOthers = async () => {
    setRevokingAll(true)
    const { error } = await authClient.revokeOtherSessions()
    setRevokingAll(false)
    if (error) {
      toast.error(error.message ?? "Failed to revoke sessions")
      return
    }
    setSessions((prev) => prev.filter((s) => s.token === currentToken))
    toast.success("Other sessions revoked")
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold text-foreground">
            Active sessions
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Devices currently signed into your account.
          </p>
        </div>
        {otherSessionsCount > 0 && (
          <Button
            variant="outline"
            size="xs"
            disabled={revokingAll}
            onClick={handleRevokeOthers}
          >
            {revokingAll && <Loader2 className="animate-spin" />}
            Sign out others
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((item) => {
            const isCurrent = item.token === currentToken
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-sidebar-border bg-card/40 px-3.5 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Laptop className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-medium text-foreground">
                        {parseUserAgent(item.userAgent)}
                      </p>
                      {isCurrent && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1.5 text-[10px]"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.ipAddress ?? "Unknown IP"}
                    </p>
                  </div>
                </div>

                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={revokingToken === item.token}
                    onClick={() => handleRevoke(item.token)}
                  >
                    {revokingToken === item.token ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Revoke"
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const

  return (
    <div className="space-y-3.5">
      <div>
        <h4 className="text-xs font-semibold text-foreground">Appearance</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Select your interface theme or press{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">
            D
          </kbd>{" "}
          to toggle.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = (theme ?? "system") === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors",
                isSelected
                  ? "border-foreground bg-muted/60 text-foreground"
                  : "border-sidebar-border bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-3.5" />
                <span className="text-xs font-medium">{option.label}</span>
              </div>
              {isSelected && <Check className="size-3.5 text-foreground" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NotificationsSection() {
  const [prefs, setPrefs] = React.useState({
    security: true,
    deployments: true,
    invitations: true,
    updates: false,
  })

  const items = [
    {
      key: "security" as const,
      title: "Security alerts",
      description: "New sign-ins, password changes, and account activity.",
    },
    {
      key: "deployments" as const,
      title: "Deployment status",
      description: "Notifications when builds succeed or fail.",
    },
    {
      key: "invitations" as const,
      title: "Team invitations",
      description: "When someone invites you to join a team.",
    },
    {
      key: "updates" as const,
      title: "Product updates",
      description: "Occasional release notes and changelog highlights.",
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold text-foreground">Notifications</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Choose which account notifications you receive.
        </p>
      </div>

      <div className="divide-y divide-sidebar-border">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
          >
            <div>
              <p className="text-xs font-medium text-foreground">
                {item.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Switch
              checked={prefs[item.key]}
              onCheckedChange={(checked) =>
                setPrefs((prev) => ({ ...prev, [item.key]: checked }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
