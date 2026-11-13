import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@workspace/ui",
    "@workspace/env",
    "@workspace/db",
    "@workspace/auth",
  ],
}

export default nextConfig
