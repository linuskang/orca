"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in")
    }
  }, [isPending, session, router])

  if (isPending) {
    return <main className="p-6">Loading...</main>
  }

  if (!session) {
    return null
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-2">Welcome, {session.user.name ?? session.user.email}</p>
      <p className="mb-4 text-sm text-gray-500">{session.user.email}</p>
      <button
        onClick={() => authClient.signOut()}
        className="rounded border px-3 py-2"
      >
        Sign out
      </button>
    </main>
  )
}
