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
      console.log('[AgentLayout] Skipping profile check', {
        isInitialized,
        hasUser: !!user,
        role: user?.role,
        pathname,
      });
      setCheckingProfile(false);
      return;
    }

    const checkProfileCompletion = async () => {
      console.log('[AgentLayout] Checking profile completion...');
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
          console.warn('[AgentLayout] No access token found for profile check');
          setCheckingProfile(false);
          return;
        }

        console.log('[AgentLayout] Calling /api/user/profile', { userId: user.id, email: user.email });
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
              console.log('[AgentLayout] Profile incomplete, redirecting to onboarding', {
                completionPercentage,
                onboardingCompleted,
              });
              router.push('/agent/onboarding');
              return;
            }
          } else {
            // No profile found, redirect to onboarding
            if (pathname !== '/agent/onboarding') {
              console.log('[AgentLayout] No profile found, redirecting to onboarding');
              router.push('/agent/onboarding');
              return;
            }
          }
        } else {
          const text = await response.text().catch(() => '');
          console.warn('[AgentLayout] /api/user/profile not ok', { status: response.status, text });
        }
      } catch (error) {
        console.error('Profile completion check error:', error);
      } finally {
        console.log('[AgentLayout] Profile check done');
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

