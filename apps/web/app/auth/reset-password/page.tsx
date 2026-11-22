"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { createForm } from "@workspace/ui/components/form"

import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

type ResetPasswordFormData = {
  password: string
  confirmPassword: string
}

const ResetPasswordForm = createForm<ResetPasswordFormData>()

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const errorParam = searchParams.get("error")

  const [disabled, setDisabled] = useState(false)
  const [error, setError] = useState<string | null>(
    errorParam ? "This reset link is invalid or has expired." : null
  )

  const router = useRouter()

  const handleResetPassword = async (d: ResetPasswordFormData) => {
    if (!token) {
      setError("Reset token is missing or invalid.")
      return
    }

    await authClient.resetPassword(
      {
        newPassword: d.password,
        token,
      },
      {
        onRequest: () => {
          setDisabled(true)
          setError(null)
        },
        onSuccess: () => {
          toast.success("Password reset successfully. Please sign in.")
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
    <Card className="w-full max-w-sm gap-0 p-0 shadow-md">
      <div className="rounded-b-xl border-b border-inner-border bg-inner-card p-4">
        <h1 className="text-xl font-semibold text-foreground">Orca</h1>
        <p className="mt-1 text-xs text-card-foreground">
          Enter your new password below
        </p>

        <div className="mt-4">
          {!token ? (
            <div className="space-y-4">
              <p className="text-center text-xs text-destructive">
                This reset link is invalid or has expired.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push("/auth/forgot-password")}
              >
                Request New Link
              </Button>
            </div>
          ) : (
            <ResetPasswordForm onSubmit={handleResetPassword}>
              <div className="space-y-4">
                <ResetPasswordForm.Item name="password">
                  <ResetPasswordForm.Label>
                    New Password
                  </ResetPasswordForm.Label>
                  <ResetPasswordForm.Field
                    required
                    rules={{
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    }}
                  >
                    <Input
                      type="password"
                      autoFocus
                      className="text-foreground"
                    />
                  </ResetPasswordForm.Field>
                  <ResetPasswordForm.Error className="-mt-2 text-xs text-destructive" />
                </ResetPasswordForm.Item>

                <ResetPasswordForm.Item name="confirmPassword">
                  <ResetPasswordForm.Label>
                    Confirm Password
                  </ResetPasswordForm.Label>
                  <ResetPasswordForm.Field
                    required
                    rules={{
                      validate: (value, formValues) =>
                        value === formValues.password ||
                        "Passwords do not match",
                    }}
                  >
                    <Input type="password" className="text-foreground" />
                  </ResetPasswordForm.Field>
                  <ResetPasswordForm.Error className="-mt-2 text-xs text-destructive" />
                </ResetPasswordForm.Item>

                <ResetPasswordForm.Submit asChild>
                  <Button className="w-full" disabled={disabled}>
                    Reset Password
                  </Button>
                </ResetPasswordForm.Submit>

                {error && (
                  <p className="text-center text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
            </ResetPasswordForm>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-3">
        <p className="text-xs font-medium text-card-foreground">
          Remember your password?{" "}
          <Link href="/auth/login" className="underline">
            Sign in
          </Link>
          .
        </p>
      </div>
    </Card>
  )
}

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Suspense fallback={null}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
