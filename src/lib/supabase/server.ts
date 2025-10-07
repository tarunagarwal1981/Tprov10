import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from './types';

// Type definitions for Supabase server clients
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
 * Creates a Supabase client for server-side usage with SSR support
 * Use this in Server Components, API routes, and server actions
 */
export const createSupabaseServerClient = async (): Promise<SupabaseServerClientType> => {
  const cookieStore = await cookies();

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
export const createSupabaseAdminClient = (): SupabaseServerClientType => {
  return createServerClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op for admin client
      },
    },
  });
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
 * Helper function to get user from server client
 * @param supabase - Server Supabase client
 * @returns User data or null
 */
export async function getServerUser(supabase: SupabaseServerClientType) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Helper function to sign out user from server client
 * @param supabase - Server Supabase client
 * @returns Success status
 */
export async function signOutServer(supabase: SupabaseServerClientType) {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
}

// Export all server clients
export {
  createSupabaseServerClient as createServerClient,
  createSupabaseAdminClient as createAdminClient,
  createSupabaseMiddlewareClient as createMiddlewareClient,
};

