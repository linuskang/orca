"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { createForm } from "@workspace/ui/components/form"

import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"

import { Key } from "lucide-react"

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

  const signInWithPasskey = async () => {}

  const signIn = async (d: LoginFormData) => {
    await authClient.signIn.email(
      {
        email: d.email,
        password: d.password,
        rememberMe: d.rememberMe,
      },
      {
        onRequest: () => {
          setSignInDisabled(true)
          setError(null)
        },
        onSuccess: () => {
          router.push("/dashboard")
          setSignInDisabled(false)
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
      <Card className="w-full max-w-sm gap-0 p-0">
        <div className="rounded-b-xl border-b border-inner-border bg-inner-card p-4">
          <h1 className="text-xl font-semibold text-foreground">Orca</h1>
          <p className="mt-1 text-xs text-card-foreground">
            Sign in to manage your applications and infrastructure
          </p>

          <div className="mt-4">
            <LoginForm onSubmit={(d) => signIn(d)}>
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
                    <Input type="password" className="text-foreground" />
                  </LoginForm.Field>
                  <LoginForm.Error className="-mt-2 text-xs text-destructive" />
                </LoginForm.Item>

                <LoginForm.Item name="rememberMe">
                  <div className="flex items-center gap-2">
                    <Checkbox />
                    <p>Remember me</p>
                  </div>
                </LoginForm.Item>

                <LoginForm.Submit asChild>
                  <Button
                    className="w-full text-foreground"
                    disabled={signInDisabled}
                  >
                    Sign in
                  </Button>
                </LoginForm.Submit>

                <Button
                  className="w-full text-foreground"
                  onClick={signInWithPasskey}
                  disabled={passkeyDisabled || signInDisabled}
                  variant="secondary"
                >
                  <Key /> Continue with Passkey
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

        <div className="flex flex-col items-center justify-center py-3">
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
