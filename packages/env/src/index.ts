import { config as loadDotenv } from "dotenv"
import path from "node:path"
import { createEnv } from "@t3-oss/env-core"
import * as z from "zod"

// Load the shared .env file at the root of the monorepo. Resolved relative to
// the current working directory (each consumer runs from its own package dir,
// two levels below the repo root), so bundlers don't try to bundle the file.
loadDotenv({
  path: path.resolve(process.cwd(), "../../.env"),
})

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "NEXT_PUBLIC_",

  client: {
    NEXT_PUBLIC_APP_URL: z.url().optional(),
  },

  /**
   * What object holds the environment variables at runtime.
   */
  runtimeEnv: process.env,

  /**
   * Treat empty strings as undefined so defaults can apply.
   */
  emptyStringAsUndefined: true,

  /**
   * Skip validation during CI / when explicitly requested, so builds don't
   * require real secret values.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || !!process.env.CI,
})
