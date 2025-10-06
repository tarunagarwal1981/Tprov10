// Legacy Supabase configuration - DEPRECATED
// Use src/lib/supabase/client.ts for new implementations

import { createSupabaseBrowserClient } from './supabase/client';
import type { Database } from './supabase/types';

// Legacy exports for backward compatibility (avoid eager init)
export const createClientComponentClient = () => {
  return createSupabaseBrowserClient();
};

// Legacy browser client function
// Backwards alias
export const getSupabaseClient = createClientComponentClient;

// Re-export Database type for backward compatibility
export type { Database };
