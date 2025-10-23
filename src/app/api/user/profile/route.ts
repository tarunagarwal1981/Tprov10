import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { userId, accessToken } = await request.json();

    if (!userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing userId or accessToken' },
        { status: 400 }
      );
    }

    // Verify the access token is valid
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError || !user || user.id !== userId) {
      console.error('Auth verification failed:', authError);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch user profile from database (server-side, no browser blocking!)
    console.log('📡 [SERVER] Fetching user profile for:', userId);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ [SERVER] Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError },
        { status: 500 }
      );
    }

    if (!profile) {
      console.error('❌ [SERVER] No profile found for user:', userId);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ [SERVER] Profile fetched successfully:', profile.email);
    return NextResponse.json({ profile });

  } catch (error) {
    console.error('❌ [SERVER] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

