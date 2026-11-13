import { createRequire } from "node:module"
import path from "node:path"

const require = createRequire(import.meta.url)

// Load the shared .env file in local development. No-op if dotenv or the file
// is missing (e.g. in CI / containers, where env vars come from the environment).
try {
  require("dotenv").config({
    path: path.resolve(process.cwd(), "../../.env"),
  })
} catch {
  // dotenv not available — rely on process.env.
}
