/**
 * Profile Completion Redirect Logic
 * Checks if user needs to complete profile and redirects accordingly
 */

export interface ProfileCheckResult {
  needsOnboarding: boolean;
  completionPercentage: number;
  redirectUrl?: string;
}

/**
 * Check if user needs to complete profile
 */
export async function checkProfileCompletion(
  userId: string,
  userRole: string
): Promise<ProfileCheckResult> {
  // Only check for travel agents
  if (userRole !== 'TRAVEL_AGENT') {
    return {
      needsOnboarding: false,
      completionPercentage: 100,
    };
  }

  try {
    const tokens = typeof window !== 'undefined' ? localStorage.getItem('cognito_tokens') : null;
    const phoneSession = typeof window !== 'undefined' ? localStorage.getItem('phoneAuthSession') : null;

    let accessToken: string | null = null;
    if (tokens) {
      try {
        const parsed = JSON.parse(tokens);
        accessToken = parsed.accessToken;
      } catch (e) {
        // Invalid token format
      }
    } else if (phoneSession) {
      // Use phone session as token
      accessToken = phoneSession;
    }

    if (!accessToken) {
      return {
        needsOnboarding: false,
        completionPercentage: 0,
      };
    }

    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        userId,
        accessToken,
      }),
    });

    if (!response.ok) {
      return {
        needsOnboarding: false,
        completionPercentage: 0,
      };
    }

    const data = await response.json();
    const profile = data.profile;

    if (!profile) {
      return {
        needsOnboarding: true,
        completionPercentage: 0,
        redirectUrl: '/agent/onboarding',
      };
    }

    const completionPercentage = profile.profile_completion_percentage || 0;
    const onboardingCompleted = profile.onboarding_completed || false;

    if (completionPercentage < 100 || !onboardingCompleted) {
      return {
        needsOnboarding: true,
        completionPercentage,
        redirectUrl: '/agent/onboarding',
      };
    }

    return {
      needsOnboarding: false,
      completionPercentage,
    };
  } catch (error) {
    console.error('Profile completion check error:', error);
    return {
      needsOnboarding: false,
      completionPercentage: 0,
    };
  }
}

