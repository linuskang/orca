"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { isPasskeyCancelledError } from "@/lib/security"
import { createForm } from "@workspace/ui/components/form"

import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"

import { Key, Loader2 } from "lucide-react"

type LoginFormData = {
  email: string
  password: string
  rememberMe: boolean
}

const LoginForm = createForm<LoginFormData>()

export default function Page() {
  const [passkeyDisabled, setPasskeyDisabled] = useState(false)
  const [signInDisabled, setSignInDisabled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    let active = true

    const initConditionalPasskey = async () => {
      if (
        typeof window === "undefined" ||
        typeof PublicKeyCredential === "undefined" ||
        typeof PublicKeyCredential.isConditionalMediationAvailable !==
          "function"
      ) {
        return
      }

      const available =
        await PublicKeyCredential.isConditionalMediationAvailable().catch(
          () => false
        )
      if (!available || !active) return

      const result = await authClient.signIn.passkey({ autoFill: true })
      if (!active) return

      if (!result.error && result.data) {
        router.push("/dashboard")
      }
    }

    void initConditionalPasskey()

    return () => {
      active = false
    }
  }, [router])

  const signInWithPasskey = async () => {
    setPasskeyDisabled(true)
    setError(null)

    const result = await authClient.signIn.passkey()

    setPasskeyDisabled(false)

    if (result.error) {
      const code = "code" in result.error ? result.error.code : undefined
      if (isPasskeyCancelledError(code)) {
        return
      }
      setError(result.error.message ?? "Passkey sign-in failed")
      return
    }

    router.push("/dashboard")
  }

  const signIn = async (d: LoginFormData) => {
    await authClient.signIn.email(
      {
        email: d.email,
        password: d.password,
        rememberMe: Boolean(d.rememberMe),
      },
      {
        onRequest: () => {
          setSignInDisabled(true)
          setError(null)
        },
        onSuccess: (ctx) => {
          setSignInDisabled(false)
          const data = ctx.data as { twoFactorRedirect?: boolean } | null
          if (data?.twoFactorRedirect) {
            router.push("/auth/two-factor")
            return
          }
          router.push("/dashboard")
        },
        onError: (ctx) => {
          setSignInDisabled(false)
          setError(ctx.error.message)
        },
      }
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-sm gap-0 p-0 shadow-md">
        <div className="rounded-b-xl border-b border-inner-border bg-inner-card p-4">
          <h1 className="text-xl font-semibold text-foreground">Orca</h1>
          <p className="mt-1 text-xs text-card-foreground">
            Sign in to manage your applications and infrastructure
          </p>

          <div className="mt-4">
            <LoginForm
              formOptions={{ defaultValues: { rememberMe: false } }}
              onSubmit={(d) => signIn(d)}
            >
              <div className="space-y-4">
                <LoginForm.Item name="email">
                  <LoginForm.Label>Email</LoginForm.Label>
                  <LoginForm.Field
                    required
                    rules={{
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                    }}
                  >
                    <Input
                      type="email"
                      autoComplete="username webauthn"
                      autoFocus
                      placeholder="you@example.com"
                      className="text-foreground"
                    />
                  </LoginForm.Field>
                  <LoginForm.Error className="-mt-2 text-xs text-destructive" />
                </LoginForm.Item>

                <LoginForm.Item name="password">
                  <LoginForm.Label>Password</LoginForm.Label>
                  <LoginForm.Field required>
                    <Input
                      type="password"
                      autoComplete="current-password webauthn"
                      className="text-foreground"
                    />
                  </LoginForm.Field>
                  <LoginForm.Error className="-mt-2 text-xs text-destructive" />
                </LoginForm.Item>

                <LoginForm.Item name="rememberMe">
                  <div className="flex items-center gap-2">
                    <LoginForm.Field>
                      {({ field, fieldId }) => (
                        <Checkbox
                          id={fieldId}
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      )}
                    </LoginForm.Field>
                    <LoginForm.Label className="text-xs font-normal text-card-foreground">
                      Remember me
                    </LoginForm.Label>
                  </div>
                </LoginForm.Item>

                <LoginForm.Submit asChild>
                  <Button
                    className="w-full"
                    disabled={signInDisabled || passkeyDisabled}
                  >
                    {signInDisabled && <Loader2 className="animate-spin" />}
                    Sign in
                  </Button>
                </LoginForm.Submit>

                <Button
                  type="button"
                  className="w-full"
                  onClick={signInWithPasskey}
                  disabled={passkeyDisabled || signInDisabled}
                  variant="secondary"
                >
                  {passkeyDisabled ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Key />
                  )}
                  Continue with Passkey
                </Button>
                {error && (
                  <p className="text-center text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
            </LoginForm>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 py-3">
          <p className="text-xs font-medium text-card-foreground">
            <Link href="/auth/forgot-password" className="underline">
              Forgotten your password?
            </Link>
          </p>
          <p className="text-xs font-medium text-card-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="underline">
              Register an account
            </Link>
            .
          </p>
        </div>
      </Card>
    </div>
  )
}
