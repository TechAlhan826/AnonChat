import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Transpile packages from monorepo
  transpilePackages: ['@repo/ui', '@repo/eslint-config', '@repo/typescript-config'],
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Experimental features for better monorepo support
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
};

export default nextConfig;
