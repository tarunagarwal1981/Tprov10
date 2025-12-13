'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  const hasRedirectedRef = useRef(false);
  const isOnboardingOrProfile = pathname?.includes('/onboarding') || pathname?.includes('/profile');

  useEffect(() => {
    // Reset redirect flag when pathname changes to onboarding/profile
    if (isOnboardingOrProfile) {
      hasRedirectedRef.current = false;
    }
  }, [isOnboardingOrProfile]);

  useEffect(() => {
    // Only check for travel agents, and skip if already on onboarding/profile page
    if (
      !isInitialized ||
      !user ||
      user.role !== 'TRAVEL_AGENT' ||
      isOnboardingOrProfile
    ) {
      // Skipping profile check
      setCheckingProfile(false);
      return;
    }

    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      // Already redirected, skipping check
      setCheckingProfile(false);
      return;
    }

    const checkProfileCompletion = async () => {
      // Checking profile completion
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

        // Calling /api/user/profile
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

            // Profile status checked (onboarding guard relaxed)
            // Note: We're not redirecting anymore - users can access dashboard even with incomplete profile
          } else {
            // No profile found (onboarding guard relaxed)
          }
        } else {
          const text = await response.text().catch(() => '');
          console.warn('[AgentLayout] /api/user/profile not ok', { status: response.status, text });
        }
      } catch (error) {
        console.error('Profile completion check error:', error);
      } finally {
        // Profile check done
        setCheckingProfile(false);
      }
    };

    checkProfileCompletion();
  }, [user, isInitialized, pathname, isOnboardingOrProfile]);

  if (checkingProfile) {
    // Still checking profile, showing spinner
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  // Profile check complete, rendering children

  return (
    <ProtectedRoute requiredRoles={AGENT_ROLES}>
      <AgentDashboardLayout>
        {children}
      </AgentDashboardLayout>
    </ProtectedRoute>
  );
}

