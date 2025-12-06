'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AgentDashboardLayout } from '@/components/dashboard/AgentDashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/CognitoAuthContext';
import { UserRole } from '@/lib/types';

const AGENT_ROLES: UserRole[] = ['TRAVEL_AGENT', 'ADMIN', 'SUPER_ADMIN'];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    // Only check for travel agents, and skip if already on onboarding page
    if (
      !isInitialized ||
      !user ||
      user.role !== 'TRAVEL_AGENT' ||
      pathname?.includes('/onboarding') ||
      pathname?.includes('/profile')
    ) {
      setCheckingProfile(false);
      return;
    }

    const checkProfileCompletion = async () => {
      try {
        const tokens = localStorage.getItem('cognito_tokens');
        const phoneSession = localStorage.getItem('phoneAuthSession');
        
        let accessToken: string | null = null;
        if (tokens) {
          try {
            const parsed = JSON.parse(tokens);
            accessToken = parsed.accessToken;
          } catch (e) {
            // Invalid token format
          }
        } else if (phoneSession) {
          accessToken = phoneSession;
        }

        if (!accessToken) {
          setCheckingProfile(false);
          return;
        }

        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            accessToken,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const profile = data.profile;

          if (profile) {
            const completionPercentage = profile.profile_completion_percentage || 0;
            const onboardingCompleted = profile.onboarding_completed || false;

            // Redirect to onboarding if profile is incomplete
            if ((completionPercentage < 100 || !onboardingCompleted) && pathname !== '/agent/onboarding') {
              router.push('/agent/onboarding');
              return;
            }
          } else {
            // No profile found, redirect to onboarding
            if (pathname !== '/agent/onboarding') {
              router.push('/agent/onboarding');
              return;
            }
          }
        }
      } catch (error) {
        console.error('Profile completion check error:', error);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileCompletion();
  }, [user, isInitialized, pathname, router]);

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={AGENT_ROLES}>
      <AgentDashboardLayout>
        {children}
      </AgentDashboardLayout>
    </ProtectedRoute>
  );
}

