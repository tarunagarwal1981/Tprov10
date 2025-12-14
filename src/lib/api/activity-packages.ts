/**
 * Activity Packages API Service
 * Wrapper for API routes - no Supabase dependencies
 */

import type { ActivityPackageFormData } from '@/lib/types/activity-package';

// Re-export transformation functions from supabase file (they don't use Supabase)
export { formDataToDatabase, databaseToFormData } from '@/lib/supabase/activity-packages';

export interface CreateActivityPackageData {
  package: any;
  images?: any[];
  time_slots?: any[];
  variants?: any[];
  faqs?: any[];
}

export interface UpdateActivityPackageData {
  package: any;
  images?: any[];
  time_slots?: any[];
  variants?: any[];
  faqs?: any[];
}

export interface ActivityPackageWithRelations {
  id: string;
  [key: string]: any;
}

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Create a new activity package using API route
 */
export async function createActivityPackage(
  data: CreateActivityPackageData,
  userId: string
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  try {
    const response = await fetch('/api/operator/packages/activity/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { ...data.package, operator_id: userId },
        images: data.images || [],
        time_slots: data.time_slots || [],
        variants: data.variants || [],
        faqs: data.faqs || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: {
          message: errorData.error || 'Failed to create package',
          details: errorData.details,
        },
      };
    }

    const apiResult = await response.json();
    const packageId = apiResult.data?.id || apiResult.package?.id;

    if (!packageId) {
      return {
        data: null,
        error: { message: 'Failed to get package ID from API' },
      };
    }

    const result: ActivityPackageWithRelations = {
      id: packageId,
      ...data.package,
      images: data.images || [],
      time_slots: data.time_slots || [],
      variants: data.variants || [],
      faqs: data.faqs || [],
    };

    return { data: result, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to create package',
      },
    };
  }
}

/**
 * Update activity package using API route
 */
export async function updateActivityPackage(
  id: string,
  data: UpdateActivityPackageData
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  try {
    const response = await fetch('/api/operator/packages/activity/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: id,
        package: data.package,
        images: data.images || [],
        time_slots: data.time_slots || [],
        variants: data.variants || [],
        faqs: data.faqs || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: {
          message: errorData.error || 'Failed to update package',
          details: errorData.details,
        },
      };
    }

    const apiResult = await response.json();
    const result: ActivityPackageWithRelations = {
      id,
      ...data.package,
      images: data.images || [],
      time_slots: data.time_slots || [],
      variants: data.variants || [],
      faqs: data.faqs || [],
    };

    return { data: result, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to update package',
      },
    };
  }
}

/**
 * Get activity package by ID
 */
export async function getActivityPackage(
  id: string
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  try {
    const response = await fetch(`/api/operator/packages/activity/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: {
          message: errorData.error || 'Failed to fetch package',
        },
      };
    }

    const apiResult = await response.json();
    return { data: apiResult.package || apiResult.data, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to fetch package',
      },
    };
  }
}
