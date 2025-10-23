/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Netlify adapter for server-side features (API routes, SSR)
  // Removed 'output: export' to enable API routes
  
  // Enable experimental features
  experimental: {
    // Server actions are enabled by default in Next.js 15
  },


  // Enable strict mode
  reactStrictMode: true,

  // Compiler options (removeConsole disabled for faster builds)
  // compiler: {
  //   removeConsole: process.env.NODE_ENV === 'production',
  // },

  // Webpack configuration for cross-platform compatibility
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Handle file extensions
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },

  // Image configuration - unoptimized for static export
  images: {
    unoptimized: true,
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
