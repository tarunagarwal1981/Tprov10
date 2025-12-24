import { NextResponse } from 'next/server';

/**
 * CORS Helper Utility
 * 
 * Use this helper in API routes to ensure CORS headers are properly set
 * even if middleware doesn't catch them
 */

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'https://dev.d2p2uq8t9xysui.amplifyapp.com',
  'https://main.d2p2uq8t9xysui.amplifyapp.com',
  'https://dev.travelselbuy.com',
  'https://travelselbuy.com',
  'https://www.travelselbuy.com',
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.includes('.amplifyapp.com')) return true; // Allow all Amplify domains
  return false;
}

function getAllowedOrigin(origin: string | null): string {
  if (origin && isAllowedOrigin(origin)) {
    return origin;
  }
  // Fallback to first allowed origin, or localhost if array is empty (should never happen)
  return allowedOrigins[0] || 'http://localhost:3000';
}

/**
 * Add CORS headers to a NextResponse
 * Use this in API routes if you need to ensure CORS headers are set
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  const allowedOrigin = getAllowedOrigin(origin);
  
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

/**
 * Create a CORS-enabled response
 */
export function createCorsResponse(
  data: any,
  status: number = 200,
  origin: string | null = null
): NextResponse {
  const response = NextResponse.json(data, { status });
  return addCorsHeaders(response, origin);
}

