// Example usage of the new Supabase client configuration
// This file demonstrates how to use the different clients in various contexts

import { useState, useEffect } from 'react';
import { 
  createSupabaseBrowserClient,
  createSupabaseServerClient,
  createSupabaseAdminClient,
  withErrorHandling,
  getServerUser,
  getBrowserUser,
  type User,
  type Destination
} from '@/lib/supabase/client';

// Example 1: Client Component Usage
export function ClientComponentExample() {
  const supabase = createSupabaseBrowserClient();
  
  const handleSignIn = async () => {
    const { data, error } = await withErrorHandling(() =>
      supabase.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'password'
      })
    );
    
    if (error) {
      console.error('Sign in failed:', error.message);
      return;
    }
    
    console.log('User signed in:', data.user);
  };
  
  return (
    <button onClick={handleSignIn}>
      Sign In
    </button>
  );
}

// Example 2: Server Component Usage
export async function ServerComponentExample() {
  const supabase = createSupabaseServerClient();
  
  // Get user with error handling
  const user = await getServerUser(supabase);
  
  if (!user) {
    return <div>Please sign in to view this content</div>;
  }
  
  // Fetch destinations with error handling
  const { data: destinations, error } = await withErrorHandling(() =>
    supabase
      .from('destinations')
      .select('*')
      .limit(10)
  );
  
  if (error) {
    console.error('Error fetching destinations:', error.message);
    return <div>Error loading destinations</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <h2>Destinations</h2>
      <ul>
        {destinations?.map((destination: Destination) => (
          <li key={destination.id}>
            {destination.name} - {destination.city}, {destination.country}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Example 3: Server Action Usage
export async function createUserAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  
  const userData = {
    email: formData.get('email') as string,
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
  };
  
  const { data, error } = await withErrorHandling(() =>
    supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
  );
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, user: data };
}

// Example 4: API Route Usage
export async function GET() {
  const supabase = createSupabaseServerClient();
  
  const { data: destinations, error } = await withErrorHandling(() =>
    supabase
      .from('destinations')
      .select('*')
      .order('rating', { ascending: false })
      .limit(20)
  );
  
  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  return Response.json({ destinations });
}

// Example 5: Custom Hook Usage
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    const getUser = async () => {
      const userData = await getBrowserUser(supabase);
      setUser(userData);
      setLoading(false);
    };
    
    getUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, loading };
}
