"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { createForm } from "@workspace/ui/components/form"

import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

type RequestResetPasswordFormData = {
  email: string
}

const RequestResetPasswordForm = createForm<RequestResetPasswordFormData>()

export default function Page() {
  const [disabled, setDisabled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const requestResetPassword = async (d: RequestResetPasswordFormData) => {
    await authClient.requestPasswordReset(
      {
        email: d.email,
        redirectTo: "/auth/reset-password",
      },
      {
        onRequest: () => {
          setDisabled(true)
          setError(null)
        },
        onSuccess: () => {
          toast.success(
            "If an account with this email exists, a reset link has been sent."
          )
          router.push("/auth/login")
          setDisabled(false)
        },
        onError: (ctx) => {
          setDisabled(false)
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
            Enter your email and we&apos;ll send you a secure reset link for
            your account
          </p>

          <div className="mt-4">
            <RequestResetPasswordForm onSubmit={(d) => requestResetPassword(d)}>
              <div className="space-y-4">
                <RequestResetPasswordForm.Item name="email">
                  <RequestResetPasswordForm.Label>
                    Email
                  </RequestResetPasswordForm.Label>
                  <RequestResetPasswordForm.Field
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
                  </RequestResetPasswordForm.Field>
                  <RequestResetPasswordForm.Error className="-mt-2 text-xs text-destructive" />
                </RequestResetPasswordForm.Item>

                <RequestResetPasswordForm.Submit asChild>
                  <Button
                    className="w-full text-foreground"
                    disabled={disabled}
                  >
                    Send Password Reset Link
                  </Button>
                </RequestResetPasswordForm.Submit>

                {error && (
                  <p className="text-center text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
            </RequestResetPasswordForm>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-3">
          <p className="text-xs font-medium text-card-foreground">
            Remembered your password?{" "}
            <Link href="/auth/login" className="underline">
              Sign in
            </Link>
            .
          </p>
        </div>
      </Card>
    </div>
  )
}
