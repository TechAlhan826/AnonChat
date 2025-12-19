import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ensure file tracing resolves from repo root in monorepo deployments (prevents symlinked output packages on Vercel).
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
};

export default nextConfig;
