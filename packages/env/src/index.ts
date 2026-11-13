import { config as loadDotenv } from "dotenv"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { createEnv } from "@t3-oss/env-core"
import * as z from "zod"

// Load the shared .env file at the root of the monorepo.
loadDotenv({
  path: path.resolve(fileURLToPath(new URL("../../../.env", import.meta.url))),
})

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url(),
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
})
