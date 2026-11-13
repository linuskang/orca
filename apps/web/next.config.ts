import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@workspace/ui",
    "@workspace/env",
    "@workspace/db",
    "@workspace/auth",
    "@workspace/api",
  ],
}

export default nextConfig