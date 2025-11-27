/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Netlify adapter for server-side features (API routes, SSR)
  // Removed 'output: export' to enable API routes
  
  // Expose non-sensitive environment variables
  // Sensitive secrets (RDS_PASSWORD, SUPABASE_SERVICE_ROLE_KEY) are fetched from AWS Secrets Manager at runtime
  env: {
    // Non-sensitive configuration
    DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1',
    // RDS config is now fetched from Secrets Manager at runtime (more secure)
    // Keep these as fallback for local development only
    RDS_HOST: process.env.RDS_HOST,
    RDS_HOSTNAME: process.env.RDS_HOSTNAME,
    RDS_PORT: process.env.RDS_PORT,
    RDS_USER: process.env.RDS_USER,
    RDS_USERNAME: process.env.RDS_USERNAME,
    RDS_DB: process.env.RDS_DB,
    RDS_DATABASE: process.env.RDS_DATABASE,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    // Cognito IDs are not secrets (they're public identifiers)
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    // NEXT_PUBLIC_ variables are automatically exposed to the browser
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Secrets Manager secret name (not the secret itself)
    SECRETS_MANAGER_SECRET_NAME: process.env.SECRETS_MANAGER_SECRET_NAME || 'travel-app/dev/secrets',
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
