// @ts-check
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  webpack: (config, { isServer }) => {
    // Add this webpack configuration for handling natural module
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      "webworker-threads": false
    };

    return config;
  }
}
 
module.exports = nextConfig