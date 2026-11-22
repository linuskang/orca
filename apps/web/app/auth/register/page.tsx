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
import { Checkbox } from "@workspace/ui/components/checkbox"

type SignupFormData = {
  name: string
  email: string
  password: string
}

const SignupForm = createForm<SignupFormData>()

export default function Page() {
  const [signUpDisabled, setSignUpDisabled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const signUp = async (d: SignupFormData) => {
    await authClient.signUp.email(
      {
        name: d.name,
        email: d.email,
        password: d.password,
      },
      {
        onRequest: () => {
          setSignUpDisabled(true)
          setError(null)
        },
        onSuccess: () => {
          toast.success(
            "Account created successfully! Please log in to continue."
          )
          router.push("/auth/login")
          setSignUpDisabled(false)
        },
        onError: (ctx) => {
          setSignUpDisabled(false)
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
            Create an account to get started
          </p>

          <div className="mt-4">
            <SignupForm onSubmit={(d) => signUp(d)}>
              <div className="space-y-4">
                <SignupForm.Item name="name">
                  <SignupForm.Label>Name</SignupForm.Label>
                  <SignupForm.Field
                    required
                    rules={{
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    }}
                  >
                    <Input
                      type="text"
                      autoFocus
                      placeholder="John Doe"
                      className="text-foreground"
                    />
                  </SignupForm.Field>
                  <SignupForm.Error className="-mt-2 text-xs text-destructive" />
                </SignupForm.Item>
                <SignupForm.Item name="email">
                  <SignupForm.Label>Email</SignupForm.Label>
                  <SignupForm.Field
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
                  </SignupForm.Field>
                  <SignupForm.Error className="-mt-2 text-xs text-destructive" />
                </SignupForm.Item>

                <SignupForm.Item name="password">
                  <SignupForm.Label>Password</SignupForm.Label>
                  <SignupForm.Field required>
                    <Input type="password" className="text-foreground" />
                  </SignupForm.Field>
                  <SignupForm.Error className="-mt-2 text-xs text-destructive" />
                </SignupForm.Item>

                <SignupForm.Submit asChild>
                  <Button className="w-full" disabled={signUpDisabled}>
                    Create Account
                  </Button>
                </SignupForm.Submit>

                {error && (
                  <p className="text-center text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
            </SignupForm>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-3">
          <p className="text-xs font-medium text-card-foreground">
            Already have an account?{" "}
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
