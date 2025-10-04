# Supabase Client Configuration

This directory contains a comprehensive Supabase client setup for Next.js 15 App Router with proper SSR support.

## Files

- `client.ts` - Main client configuration with all Supabase clients
- `types.ts` - TypeScript types for the Supabase database schema
- `index.ts` - Clean exports for all Supabase functionality
- `middleware.example.ts` - Example middleware usage

## Usage

### 1. Browser Client (Client Components)

```typescript
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ClientComponent() {
  const supabase = createSupabaseBrowserClient();
  
  // Use supabase client for client-side operations
  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'user@example.com',
      password: 'password'
    });
  };
  
  return <div>Client Component</div>;
}
```

### 2. Server Client (Server Components)

```typescript
import { createSupabaseServerClient, withErrorHandling } from '@/lib/supabase/client';

export default async function ServerComponent() {
  const supabase = createSupabaseServerClient();
  
  // Get user with error handling
  const { data: user, error } = await withErrorHandling(() =>
    supabase.auth.getUser()
  );
  
  if (error) {
    console.error('Error getting user:', error);
    return <div>Error loading user</div>;
  }
  
  return <div>Welcome, {user?.email}</div>;
}
```

### 3. Admin Client (Server Actions)

```typescript
import { createSupabaseAdminClient } from '@/lib/supabase/client';

export async function adminAction() {
  const supabase = createSupabaseAdminClient();
  
  // Admin operations that bypass RLS
  const { data, error } = await supabase
    .from('users')
    .select('*');
    
  return data;
}
```

### 4. Middleware Client

```typescript
// middleware.ts
import { createSupabaseMiddlewareClient } from '@/lib/supabase/client';

export async function middleware(request: NextRequest) {
  const supabase = createSupabaseMiddlewareClient(request);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

## Error Handling

All operations are wrapped with error handling:

```typescript
import { withErrorHandling, SupabaseError } from '@/lib/supabase/client';

const { data, error } = await withErrorHandling(() =>
  supabase.from('users').select('*')
);

if (error) {
  if (error instanceof SupabaseError) {
    console.error('Supabase Error:', error.message, error.code);
  }
}
```

## Helper Functions

### User Management

```typescript
import { 
  getServerUser, 
  getBrowserUser, 
  signOutServer, 
  signOutBrowser 
} from '@/lib/supabase/client';

// Server Component
const user = await getServerUser(supabase);

// Client Component
const user = await getBrowserUser(supabase);

// Sign out
await signOutServer(supabase); // Server
await signOutBrowser(supabase); // Client
```

## TypeScript Types

The configuration includes comprehensive TypeScript types:

```typescript
import type { 
  Database, 
  User, 
  Destination, 
  Hotel,
  UserInsert,
  UserUpdate 
} from '@/lib/supabase/types';

// Use types for type safety
const user: User = {
  id: 'uuid',
  email: 'user@example.com',
  name: 'John Doe',
  // ... other fields
};
```

## Environment Variables

Make sure you have these environment variables set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Cross-Platform Compatibility

The configuration ensures compatibility across:
- ✅ Browser environments
- ✅ Server environments (Node.js)
- ✅ Edge runtime
- ✅ Middleware
- ✅ Server Actions
- ✅ API Routes

## Migration from Legacy

If you're migrating from the old `supabase.ts` file:

```typescript
// Old way
import { supabase } from '@/lib/supabase';

// New way
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
const supabase = createSupabaseBrowserClient();
```

## Best Practices

1. **Use the appropriate client for your context**:
   - Browser client for client components
   - Server client for server components
   - Admin client for admin operations
   - Middleware client for middleware

2. **Always use error handling**:
   - Wrap operations with `withErrorHandling`
   - Check for errors before using data

3. **Use TypeScript types**:
   - Import types from `@/lib/supabase/types`
   - Use type-safe operations

4. **Environment variables**:
   - Never commit `.env.local` files
   - Use different environments for different stages

## Generating Types

To generate types from your Supabase schema:

```bash
supabase gen types typescript --linked > src/lib/supabase/types.ts
```

This will generate the most up-to-date types based on your actual database schema.

