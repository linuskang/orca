import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin, twoFactor } from "better-auth/plugins"
import { getAuthenticatorName, passkey } from "@better-auth/passkey"
import { prisma } from "@workspace/db"
import { env } from "@workspace/env"
import { Resend } from "resend"

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

function resolvePasskeyConfig() {
  const fallbackUrl = "http://localhost:3000"
  let parsedUrl: URL
  try {
    parsedUrl = new URL(env.BETTER_AUTH_URL || fallbackUrl)
  } catch {
    parsedUrl = new URL(fallbackUrl)
  }

  return {
    rpID: env.PASSKEY_RP_ID ?? parsedUrl.hostname,
    rpName: "Orca",
    origin: env.PASSKEY_ORIGIN ?? parsedUrl.origin,
  }
}

export const auth = betterAuth({
  appName: "Orca",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (!resend) {
        console.warn("RESEND_API_KEY is not set")
        return
      }

      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: "(Orca) Reset your password",
        html: `
          <p>Hi ${user.name},</p>
          <p>Click the link below to reset your password:</p>
          <a href="${url}">${url}</a>
          <p>If you did not request a password reset, please ignore this email.</p>
        `,
      })
    },
    onPasswordReset: async ({ user }) => {
      if (!resend) {
        console.warn("RESEND_API_KEY is not set")
        return
      }

      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: "(Orca) Your password has been reset",
        html: `
          <p>Hi ${user.name},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you did not perform this action, please contact support immediately.</p>
        `,
      })
    },
  },

  plugins: [
    admin(),
    twoFactor({
      issuer: "Orca",
    }),
    passkey({
      ...resolvePasskeyConfig(),
      registration: {
        afterVerification: ({ verification }) => {
          const detectedName = getAuthenticatorName(
            verification.registrationInfo?.aaguid
          )
          return detectedName ? { name: detectedName } : undefined
        },
      },
    }),
  ],

  advanced: {
    database: {
      joins: true,
    },
  },
})

export type Auth = typeof auth
