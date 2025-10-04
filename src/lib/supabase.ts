// Legacy Supabase configuration - DEPRECATED
// Use src/lib/supabase/client.ts for new implementations

import { createSupabaseBrowserClient } from './supabase/client';
import type { Database } from './supabase/types';

// Legacy exports for backward compatibility
export const supabase = createSupabaseBrowserClient();

// Legacy browser client function
export const createClientComponentClient = () => {
  return createSupabaseBrowserClient();
};

// Re-export Database type for backward compatibility
export type { Database };
