"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login")
    }
  }, [isPending, session, router])

  if (isPending) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-2">Welcome, {session.user.name ?? session.user.email}</p>
      <p className="mb-4 text-sm text-muted-foreground">{session.user.email}</p>
      <button
        onClick={() => authClient.signOut()}
        className="rounded-md border px-3 py-2 text-sm"
      >
        Sign out
      </button>
    </div>
  )
}
