import type { NextConfig } from "next"
import pkg from "./package.json" with { type: "json" }

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@workspace/ui",
    "@workspace/env",
    "@workspace/db",
    "@workspace/auth",
    "@workspace/api",
  ],
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
}

export default nextConfig
