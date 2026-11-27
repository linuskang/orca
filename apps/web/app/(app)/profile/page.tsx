"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Check, Laptop, Loader2, Monitor, Moon, Sun } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { PasskeysSection } from "@/components/profile/passkeys-section"
import {
  ProfileCard,
  ProfileCardContent,
  ProfileCardDescription,
  ProfileCardHeader,
  ProfileCardTitle,
} from "@/components/profile/section-card"
import { TwoFactorSection } from "@/components/profile/two-factor-section"
import { PageBreadcrumb } from "@/components/sidebar/breadcrumb"
import { cn } from "@workspace/ui/lib/utils"
import { createForm, useForm } from "@workspace/ui/components/form"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
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

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  React.useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login")
    }
  }, [isPending, session, router])

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <PageBreadcrumb items={[{ label: "Profile", href: "/profile" }]} />

      <div className="space-y-6">
        <ProfileSection />
        <PasswordSection />
        <TwoFactorSection variant="card" />
        <PasskeysSection variant="card" />
        <SessionsSection />
        <NotificationsSection />
      </div>
    </div>
  )
}

type ProfileFormData = {
  name: string
  email: string
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
      email: user?.email ?? "",
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
    <ProfileForm form={form} onSubmit={handleSave}>
      <ProfileCard>
        <ProfileCardHeader>
          <div className="min-w-0">
            <ProfileForm.Title className="text-sm font-semibold tracking-tight text-foreground">
              Profile Details
            </ProfileForm.Title>
            <ProfileForm.Description className="mt-1 text-xs text-muted-foreground">
              Manage your avatar, display name, and email.
            </ProfileForm.Description>
          </div>
        </ProfileCardHeader>

        <ProfileCardContent className="space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-foreground">Avatar</span>

            <div className="flex items-center gap-3">
              <Avatar className="size-12 shrink-0">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback className="text-sm">{initial}</AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <Button variant="outline" size="sm" className="w-fit" disabled>
                  Upload
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or WebP supported.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileForm.Item name="name">
              <div className="space-y-1.5">
                <ProfileForm.Label className="text-xs font-medium">
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

            <ProfileForm.Item name="email">
              <div className="space-y-1.5">
                <ProfileForm.Label
                  htmlFor="email"
                  className="text-xs font-medium"
                >
                  Email address
                </ProfileForm.Label>
                <Input id="email" value={user.email} disabled />
              </div>
            </ProfileForm.Item>
          </div>

          <div className="flex justify-end">
            <ProfileForm.Submit asChild pending={saving}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={!isDirty || saving}
              >
                {saving && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </ProfileForm.Submit>
          </div>
        </ProfileCardContent>
      </ProfileCard>
    </ProfileForm>
  )
}

function PasswordSection() {
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
    <SecurityForm form={form} onSubmit={handlePasswordChange}>
      <ProfileCard>
        <ProfileCardHeader>
          <div className="min-w-0">
            <SecurityForm.Title className="text-sm font-semibold tracking-tight text-foreground">
              Password
            </SecurityForm.Title>
            <SecurityForm.Description className="mt-1 text-xs text-muted-foreground">
              Updating your password will sign out other active sessions.
            </SecurityForm.Description>
          </div>
        </ProfileCardHeader>

        <ProfileCardContent className="space-y-4">
          <div className="space-y-3">
            <SecurityForm.Item name="currentPassword">
              <div className="space-y-1.5">
                <SecurityForm.Label className="text-xs font-medium">
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
                  <SecurityForm.Label className="text-xs font-medium">
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
                  <SecurityForm.Label className="text-xs font-medium">
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
                variant="outline"
                size="sm"
                disabled={saving || !canSubmit}
              >
                {saving && <Loader2 className="animate-spin" />}
                Update password
              </Button>
            </SecurityForm.Submit>
          </div>
        </ProfileCardContent>
      </ProfileCard>
    </SecurityForm>
  )
}

function SessionsSection() {
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
    void loadSessions()
  }, [loadSessions])

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
    <ProfileCard>
      <ProfileCardHeader>
        <div className="min-w-0">
          <ProfileCardTitle>Active Sessions</ProfileCardTitle>
          <ProfileCardDescription>
            Devices currently signed into your account.
          </ProfileCardDescription>
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
      </ProfileCardHeader>

      {loading ? (
        <ProfileCardContent className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </ProfileCardContent>
      ) : sessions.length > 0 ? (
        <ProfileCardContent className="divide-y divide-inner-border p-0">
          {sessions.map((item) => {
            const isCurrent = item.token === currentToken
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Laptop className="size-4" />
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
        </ProfileCardContent>
      ) : (
        <ProfileCardContent>
          <p className="text-xs text-muted-foreground">
            No active sessions found.
          </p>
        </ProfileCardContent>
      )}
    </ProfileCard>
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
    <ProfileCard>
      <ProfileCardHeader>
        <div className="min-w-0">
          <ProfileCardTitle>Appearance</ProfileCardTitle>
          <ProfileCardDescription>
            Select your interface theme or press{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">
              D
            </kbd>{" "}
            to toggle.
          </ProfileCardDescription>
        </div>
      </ProfileCardHeader>

      <ProfileCardContent>
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
                    : "border-inner-border bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
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
      </ProfileCardContent>
    </ProfileCard>
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
    <ProfileCard>
      <ProfileCardHeader>
        <div className="min-w-0">
          <ProfileCardTitle>Notifications</ProfileCardTitle>
          <ProfileCardDescription>
            Choose which account notifications you receive.
          </ProfileCardDescription>
        </div>
      </ProfileCardHeader>

      <ProfileCardContent className="divide-y divide-inner-border p-0">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
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
      </ProfileCardContent>
    </ProfileCard>
  )
}
