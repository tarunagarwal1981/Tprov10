/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    // Server actions are enabled by default in Next.js 15
  },

  // Image optimization
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },

  // Enable strict mode
  reactStrictMode: true,

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack configuration for cross-platform compatibility
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Handle file extensions
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },

  // Output configuration
  output: 'standalone',
};

export default nextConfig;
