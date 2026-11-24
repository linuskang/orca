import { createAuthClient } from "better-auth/react"
import { adminClient, twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
  plugins: [adminClient(), twoFactorClient(), passkeyClient()],
})

export type AuthClient = typeof authClient
