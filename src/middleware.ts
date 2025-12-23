import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS Middleware for Next.js API Routes
 * Handles CORS headers for all API routes to fix cross-origin issues
 * 
 * This middleware:
 * 1. Handles OPTIONS preflight requests directly
 * 2. Adds CORS headers to all API route responses
 */

const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  
  // AWS Amplify default domain
  'https://dev.d2p2uq8t9xysui.amplifyapp.com',
  'https://main.d2p2uq8t9xysui.amplifyapp.com',
  
  // Custom domains
  'https://dev.travelselbuy.com',
  'https://travelselbuy.com',
  'https://www.travelselbuy.com',
  'http://dev.travelselbuy.com',
  'http://travelselbuy.com',
  'http://www.travelselbuy.com',
];

/**
 * Check if origin is allowed (supports wildcard patterns)
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // Check exact matches first
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check if it's an Amplify domain (wildcard match)
  if (origin.includes('.amplifyapp.com')) {
    return true; // Allow all Amplify preview branches
  }
  
  return false;
}

/**
 * Get the allowed origin for the request
 */
function getAllowedOrigin(origin: string | null): string {
  if (origin && isAllowedOrigin(origin)) {
    return origin;
  }
  // Default to first allowed origin (localhost for development)
  return allowedOrigins[0];
}

export function middleware(request: NextRequest) {
  // Only handle API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    return response;
  }

  // For actual requests, create a response that will be modified by route handlers
  // We add CORS headers that will be included in the final response
  const response = NextResponse.next();
  
  // Add CORS headers to the response
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};

