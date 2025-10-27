/**
 * Activity Package Hook
 * Provides React hooks for managing activity packages with Supabase integration
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createActivityPackage,
  getActivityPackage,
  updateActivityPackage,
  deleteActivityPackage,
  listActivityPackages,
  uploadActivityPackageImage,
  deleteActivityPackageImage,
  formDataToDatabase,
  databaseToFormData,
  type ActivityPackageWithRelations,
  type ActivityPackageListResponse,
  type ActivityPackageFilters,
  type ActivityPackageListOptions,
} from '@/lib/supabase/activity-packages';
import type { ActivityPackageFormData } from '@/lib/types/activity-package';
import { useAuth } from '@/context/SupabaseAuthContext';

// ============================================================================
// TYPES
// ============================================================================

export interface UseActivityPackageOptions {
  packageId?: string;
  autoLoad?: boolean;
}

export interface UseActivityPackageReturn {
  // Data
  package: ActivityPackageWithRelations | null;
  packages: ActivityPackageWithRelations[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Actions
  createPackage: (data: ActivityPackageFormData) => Promise<boolean>;
  updatePackage: (data: ActivityPackageFormData) => Promise<boolean>;
  deletePackage: () => Promise<boolean>;
  loadPackage: (id: string) => Promise<boolean>;
  loadPackages: (options?: ActivityPackageListOptions) => Promise<boolean>;
  uploadImage: (file: File, metadata?: any) => Promise<boolean>;
  removeImage: (imageId: string) => Promise<boolean>;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useActivityPackage = (
  options: UseActivityPackageOptions = {}
): UseActivityPackageReturn => {
  const { packageId, autoLoad = false } = options;
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [activityPackage, setActivityPackage] = useState<ActivityPackageWithRelations | null>(null);
  const [packages, setPackages] = useState<ActivityPackageWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: any) => {
    console.error('Activity Package Error:', err);
    setError(err.message || 'An unexpected error occurred');
  }, []);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const createPackage = useCallback(async (data: ActivityPackageFormData): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to create packages');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const dbData = formDataToDatabase(data, user.id);
      const { data: newPackage, error: createError } = await createActivityPackage(dbData, user.id);

      if (createError) {
        handleError(createError);
        return false;
      }

      if (newPackage) {
        setActivityPackage(newPackage);
        // Don't redirect on save - stay on form to continue editing
        // router.push(`/operator/packages/${newPackage.id}`);
        toast.success('Activity package saved successfully!');
        return true;
      }

      return false;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, router, handleError]);

  const updatePackage = useCallback(async (data: ActivityPackageFormData): Promise<boolean> => {
    if (!user || !packageId) {
      setError('Missing user or package ID');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const dbData = formDataToDatabase(data, user.id);
      const { data: updatedPackage, error: updateError } = await updateActivityPackage(packageId, dbData);

      if (updateError) {
        handleError(updateError);
        return false;
      }

      if (updatedPackage) {
        setActivityPackage(updatedPackage);
        toast.success('Activity package updated successfully!');
        return true;
      }

      return false;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, packageId, handleError]);

  const deletePackage = useCallback(async (): Promise<boolean> => {
    if (!packageId) {
      setError('No package ID provided');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: success, error: deleteError } = await deleteActivityPackage(packageId);

      if (deleteError) {
        handleError(deleteError);
        return false;
      }

      if (success) {
        setActivityPackage(null);
        router.push('/operator/packages');
        return true;
      }

      return false;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [packageId, router, handleError]);

  const loadPackage = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: packageData, error: loadError } = await getActivityPackage(id);

      if (loadError) {
        handleError(loadError);
        return false;
      }

      if (packageData) {
        setActivityPackage(packageData);
        return true;
      }

      setError('Package not found');
      return false;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadPackages = useCallback(async (options: ActivityPackageListOptions = {}): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to load packages');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const filters: ActivityPackageFilters = {
        ...options.filters,
        operator_id: user.id, // Only load packages for current user
      };

      const { data: packagesData, error: loadError } = await listActivityPackages({
        ...options,
        filters,
      });

      if (loadError) {
        handleError(loadError);
        return false;
      }

      if (packagesData) {
        setPackages(packagesData.packages);
        setPagination({
          page: packagesData.page,
          limit: packagesData.limit,
          total: packagesData.total,
          totalPages: packagesData.total_pages,
        });
        return true;
      }

      return false;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  // ============================================================================
  // IMAGE OPERATIONS
  // ============================================================================

  const uploadImage = useCallback(async (file: File, metadata?: any): Promise<boolean> => {
    if (!packageId) {
      setError('No package ID provided');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: imageData, error: uploadError } = await uploadActivityPackageImage(
        packageId,
        file,
        metadata
      );

      if (uploadError) {
        handleError(uploadError);
        return false;
      }

      if (imageData && activityPackage) {
        // Update the package with the new image
        const updatedPackage = {
          ...activityPackage,
          images: [...activityPackage.images, imageData],
        };
        setActivityPackage(updatedPackage);
        return true;
      }

      return false;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [packageId, activityPackage, handleError]);

  const removeImage = useCallback(async (imageId: string): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const { data: success, error: deleteError } = await deleteActivityPackageImage(imageId);

      if (deleteError) {
        handleError(deleteError);
        return false;
      }

      if (success && activityPackage) {
        // Update the package by removing the image
        const updatedPackage = {
          ...activityPackage,
          images: activityPackage.images.filter(img => img.id !== imageId),
        };
        setActivityPackage(updatedPackage);
        return true;
      }

      return false;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [activityPackage, handleError]);

  // ============================================================================
  // REFRESH FUNCTION
  // ============================================================================

  const refresh = useCallback(async (): Promise<void> => {
    if (packageId) {
      await loadPackage(packageId);
    } else {
      await loadPackages();
    }
  }, [packageId, loadPackage, loadPackages]);

  // ============================================================================
  // AUTO-LOAD EFFECT
  // ============================================================================

  useEffect(() => {
    if (autoLoad) {
      if (packageId) {
        loadPackage(packageId);
      } else {
        loadPackages();
      }
    }
  }, [autoLoad, packageId, loadPackage, loadPackages]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    package: activityPackage,
    packages,
    loading,
    saving,
    error,
    
    // Pagination
    pagination,
    
    // Actions
    createPackage,
    updatePackage,
    deletePackage,
    loadPackage,
    loadPackages,
    uploadImage,
    removeImage,
    
    // Utilities
    clearError,
    refresh,
  };
};

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for creating a new activity package
 */
export const useCreateActivityPackage = () => {
  const { createPackage, saving, error, clearError } = useActivityPackage();
  
  return {
    createPackage,
    saving,
    error,
    clearError,
  };
};

/**
 * Hook for editing an existing activity package
 */
export const useEditActivityPackage = (packageId: string) => {
  const { 
    package: activityPackage, 
    updatePackage, 
    deletePackage, 
    loadPackage, 
    loading, 
    saving, 
    error, 
    clearError,
    refresh 
  } = useActivityPackage({ packageId, autoLoad: true });
  
  return {
    package: activityPackage,
    updatePackage,
    deletePackage,
    loadPackage,
    loading,
    saving,
    error,
    clearError,
    refresh,
  };
};

/**
 * Hook for listing activity packages
 */
export const useActivityPackageList = (options: ActivityPackageListOptions = {}) => {
  const { 
    packages, 
    loadPackages, 
    loading, 
    error, 
    clearError, 
    pagination,
    refresh 
  } = useActivityPackage({ autoLoad: true });
  
  return {
    packages,
    loadPackages,
    loading,
    error,
    clearError,
    pagination,
    refresh,
  };
};

export default useActivityPackage;
