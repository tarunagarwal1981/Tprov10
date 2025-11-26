/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Netlify adapter for server-side features (API routes, SSR)
  // Removed 'output: export' to enable API routes
  
  // Force Next.js to use environment variables from Amplify
  // This ensures they're available at both build time and runtime
  env: {
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1',
    RDS_HOST: process.env.RDS_HOST,
    RDS_PORT: process.env.RDS_PORT,
    RDS_USER: process.env.RDS_USER,
    RDS_PASSWORD: process.env.RDS_PASSWORD,
    RDS_DB: process.env.RDS_DB,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // NEXT_PUBLIC_ variables are automatically exposed to the browser
    // but we can also explicitly set them here if needed
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
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
