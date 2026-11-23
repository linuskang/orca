"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  Check,
  KeyRound,
  Laptop,
  Loader2,
  Monitor,
  Moon,
  Sun,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { PageBreadcrumb } from "@/components/sidebar/breadcrumb"
import { cn } from "@workspace/ui/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
      <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-8">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Separator />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <PageBreadcrumb items={[{ label: "Profile", href: "/profile" }]} />
      <div className="pb-6">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage your account details, security, and preferences.
        </p>
      </div>

      <div className="space-y-8">
        <ProfileSection />
        <Separator />
        <SecuritySection />
        <Separator />
        <SessionsSection />
        <Separator />
        <AppearanceSection />
        <Separator />
        <NotificationsSection />
      </div>
    </div>
  )
}

function ProfileSection() {
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [name, setName] = React.useState(user?.name ?? "")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (user?.name !== undefined) {
      setName(user.name)
    }
  }, [user?.name])

  if (!user) return null

  const initial = getInitial(user.name, user.email)
  const isDirty = name.trim() !== "" && name.trim() !== user.name

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDirty) return

    setSaving(true)
    const { error } = await authClient.updateUser({
      name: name.trim(),
    })
    setSaving(false)

    if (error) {
      toast.error(error.message ?? "Failed to update profile")
      return
    }

    toast.success("Profile updated")
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
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
        <div className="space-y-1.5">
          <Label htmlFor="account-name" className="text-xs">
            Display name
          </Label>
          <Input
            id="account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

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
        <Button type="submit" size="sm" disabled={!isDirty || saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  )
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setSaving(true)
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })
    setSaving(false)

    if (error) {
      toast.error(error.message ?? "Failed to change password")
      return
    }

    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    toast.success("Password updated")
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handlePasswordChange} className="space-y-3.5">
        <div>
          <h2 className="text-sm font-medium text-foreground">Security</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Updating your password will sign out other active sessions.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-xs">
              Current password
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs">
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs">
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={
              saving || !currentPassword || !newPassword || !confirmPassword
            }
          >
            {saving && <Loader2 className="animate-spin" />}
            Update password
          </Button>
        </div>
      </form>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-sidebar-border px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <KeyRound className="size-3.5" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Passkeys</p>
            <p className="text-[11px] text-muted-foreground">
              Sign in using biometrics or a security key.
            </p>
          </div>
        </div>
        <Button variant="outline" size="xs" disabled>
          Coming soon
        </Button>
      </div>
    </div>
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
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Active sessions
          </h2>
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
        <h2 className="text-sm font-medium text-foreground">Appearance</h2>
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
        <h2 className="text-sm font-medium text-foreground">Notifications</h2>
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
