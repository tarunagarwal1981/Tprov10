import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Type definitions for Supabase clients
export type SupabaseClientType = ReturnType<typeof createBrowserClient<Database>>;

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Warn in development if using placeholder values
if (process.env.NODE_ENV === 'development' && 
    (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-anon-key')) {
  console.warn('⚠️  Using placeholder Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
}

/**
 * Creates a Supabase client for browser/client-side usage
 * Use this in client components, hooks, and client-side functions
 */
export const createSupabaseBrowserClient = (): SupabaseClientType => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
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
};