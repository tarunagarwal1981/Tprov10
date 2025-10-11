import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Type definitions for Supabase clients
export type SupabaseClientType = ReturnType<typeof createBrowserClient<Database>>;

// Environment variables validation
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Trim to avoid issues with trailing spaces/newlines in .env files
const supabaseUrl = (rawSupabaseUrl || '').trim();
const supabaseAnonKey = (rawSupabaseAnonKey || '').trim();

// Warn in development if using placeholder values
if (process.env.NODE_ENV === 'development') {
  const maskedKey = supabaseAnonKey ? `${supabaseAnonKey.slice(0, 6)}…len:${supabaseAnonKey.length}` : 'undefined';
  console.debug('[Supabase][env] URL:', supabaseUrl || 'undefined');
  console.debug('[Supabase][env] ANON key (masked):', maskedKey);
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  }
}

/**
 * Creates a Supabase client for browser/client-side usage
 * Use this in client components, hooks, and client-side functions
 */
export const createSupabaseBrowserClient = (): SupabaseClientType => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // In production, throw an error instead of silently failing
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.error('❌ CRITICAL: Supabase environment variables are missing in production!');
      console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      console.error('Please set these in your deployment platform (Netlify/Vercel) environment variables.');
      throw new Error('Supabase configuration missing. Check deployment environment variables.');
    }
    
    // During build/prerender some environments may not expose NEXT_PUBLIC_* vars.
    // Fall back to a non-routable host to avoid accidental network calls.
    // Consumers should provide real env at runtime.
    // eslint-disable-next-line no-console
    console.warn('⚠️  Supabase credentials missing at init time. Using no-op fallback client.');
    return createBrowserClient<Database>('http://localhost.invalid', 'anon');
  }
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Supabase][init] Creating client for URL:', supabaseUrl);
  }
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
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return data?.user || null;
  } catch (err) {
    console.error('Unexpected error getting user:', err);
    return null;
  }
}

/**
 * Helper function to sign out user from browser client
 * @param supabase - Browser Supabase client
 * @returns Success status
 */
export async function signOutBrowser(supabase: SupabaseClientType) {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error signing out:', err);
    return false;
  }
}

// Export factory alias for convenience (avoid eager initialization)
export { createSupabaseBrowserClient as createClient };