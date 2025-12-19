import path from "path";
import type { NextConfig } from "next";

// Ensure serverless bundles include files that live outside this app directory (monorepo packages, shared configs).
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    // Trace from the repo root so Vercel can package non-local dependencies without symlinks.
    outputFileTracingRoot: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
