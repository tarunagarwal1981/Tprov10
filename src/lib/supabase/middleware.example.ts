// Example middleware usage with Supabase
// This file shows how to use the Supabase middleware client

import { createSupabaseMiddlewareClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabase = createSupabaseMiddlewareClient(request);
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if the user is authenticated
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Check if the user is authenticated and trying to access auth pages
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    // Redirect to dashboard if already authenticated
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

