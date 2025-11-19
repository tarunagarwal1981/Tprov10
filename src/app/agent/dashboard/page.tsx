'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /agent (the actual dashboard route)
    router.replace('/agent');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

