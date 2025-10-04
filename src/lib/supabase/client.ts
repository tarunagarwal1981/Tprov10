import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from './types';

// Type definitions for Supabase clients
export type SupabaseClientType = ReturnType<typeof createBrowserClient<Database>>;
export type SupabaseServerClientType = ReturnType<typeof createServerClient<Database>>;

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Creates a Supabase client for browser/client-side usage
 * Use this in client components, hooks, and client-side functions
 */
export const createSupabaseBrowserClient = (): SupabaseClientType => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * Creates a Supabase client for server-side usage with SSR support
 * Use this in Server Components, API routes, and server actions
 */
export const createSupabaseServerClient = (): SupabaseServerClientType => {
  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Handle cookie setting errors gracefully
          console.warn('Failed to set cookies:', error);
        }
      },
    },
  });
};

/**
 * Creates a Supabase admin client with service role privileges
 * Use this for admin operations that bypass RLS policies
 * ⚠️ Use with caution - this client has full database access
 */
export const createSupabaseAdminClient = (): SupabaseClientType => {
  return createBrowserClient<Database>(supabaseUrl, supabaseServiceRoleKey);
};

/**
 * Creates a Supabase client for middleware usage
 * Handles request/response cookies for authentication state
 */
export const createSupabaseMiddlewareClient = (
  request: NextRequest
): SupabaseServerClientType => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return supabase;
};

/**
 * Error handling wrapper for Supabase operations
 * Provides consistent error handling across the application
 */
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string,
    public hint?: string
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

/**
 * Wraps Supabase operations with error handling
 * @param operation - The Supabase operation to execute
 * @returns Promise with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: SupabaseError | null }> {
  try {
    const result = await operation();
    
    if (result.error) {
      const error = new SupabaseError(
        result.error.message || 'Supabase operation failed',
        result.error.code,
        result.error.details,
        result.error.hint
      );
      return { data: null, error };
    }

    return { data: result.data, error: null };
  } catch (error) {
    const supabaseError = new SupabaseError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
    return { data: null, error: supabaseError };
  }
}

/**
 * Helper function to get user from server client
 * @param supabase - Server Supabase client
 * @returns User data or null
 */
export async function getServerUser(supabase: SupabaseServerClientType) {
  const { data: { user }, error } = await withErrorHandling(() =>
    supabase.auth.getUser()
  );
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
}

/**
 * Helper function to get user from browser client
 * @param supabase - Browser Supabase client
 * @returns User data or null
 */
export async function getBrowserUser(supabase: SupabaseClientType) {
  const { data: { user }, error } = await withErrorHandling(() =>
    supabase.auth.getUser()
  );
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
}

/**
 * Helper function to sign out user from server client
 * @param supabase - Server Supabase client
 * @returns Success status
 */
export async function signOutServer(supabase: SupabaseServerClientType) {
  const { error } = await withErrorHandling(() =>
    supabase.auth.signOut()
  );
  
  if (error) {
    console.error('Error signing out:', error);
    return false;
  }
  
  return true;
}

/**
 * Helper function to sign out user from browser client
 * @param supabase - Browser Supabase client
 * @returns Success status
 */
export async function signOutBrowser(supabase: SupabaseClientType) {
  const { error } = await withErrorHandling(() =>
    supabase.auth.signOut()
  );
  
  if (error) {
    console.error('Error signing out:', error);
    return false;
  }
  
  return true;
}

// Export default browser client for backward compatibility
export const supabase = createSupabaseBrowserClient();

// Export all clients with proper types
export {
  createSupabaseBrowserClient as createClient,
  createSupabaseServerClient as createServerClient,
  createSupabaseAdminClient as createAdminClient,
  createSupabaseMiddlewareClient as createMiddlewareClient,
};

