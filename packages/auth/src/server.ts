import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@workspace/db"
import { env } from "@workspace/env"
import { admin } from "better-auth/plugins"
import { Resend } from "resend"

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export const auth = betterAuth({
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

  plugins: [admin()],

  advanced: {
    database: {
      joins: true,
    },
  },
})

export type Auth = typeof auth
