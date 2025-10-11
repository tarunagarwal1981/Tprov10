/**
 * Transfer Package Hook
 * Provides React hooks for managing transfer packages with Supabase integration
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTransferPackage,
  getTransferPackage,
  updateTransferPackage,
  deleteTransferPackage,
  listTransferPackages,
  formDataToDatabase,
  type TransferPackageWithRelations,
} from '@/lib/supabase/transfer-packages';
import type { TransferPackageFormData } from '@/lib/types/transfer-package';
import { useAuth } from '@/context/SupabaseAuthContext';

// ============================================================================
// TYPES
// ============================================================================

export interface UseTransferPackageOptions {
  packageId?: string;
  autoLoad?: boolean;
}

export interface UseTransferPackageReturn {
  // Data
  package: TransferPackageWithRelations | null;
  packages: TransferPackageWithRelations[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // Actions
  createPackage: (data: TransferPackageFormData) => Promise<boolean>;
  updatePackage: (data: TransferPackageFormData) => Promise<boolean>;
  deletePackage: () => Promise<boolean>;
  loadPackage: (id: string) => Promise<boolean>;
  loadPackages: (filters?: { status?: string }) => Promise<boolean>;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useTransferPackage = (
  options: UseTransferPackageOptions = {}
): UseTransferPackageReturn => {
  const { packageId, autoLoad = false } = options;
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [transferPackage, setTransferPackage] = useState<TransferPackageWithRelations | null>(null);
  const [packages, setPackages] = useState<TransferPackageWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: any) => {
    console.error('Transfer Package Error:', err);
    setError(err.message || 'An unexpected error occurred');
  }, []);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const createPackage = useCallback(async (data: TransferPackageFormData): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to create packages');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const dbData = formDataToDatabase(data, user.id);
      const { data: newPackage, error: createError } = await createTransferPackage(dbData, user.id);

      if (createError) {
        handleError(createError);
        return false;
      }

      if (newPackage) {
        setTransferPackage(newPackage);
        router.push(`/operator/packages/transfer/${newPackage.id}`);
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

  const updatePackage = useCallback(async (data: TransferPackageFormData): Promise<boolean> => {
    if (!user || !packageId) {
      setError('Missing user or package ID');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const dbData = formDataToDatabase(data, user.id);
      const { data: updatedPackage, error: updateError } = await updateTransferPackage(packageId, dbData);

      if (updateError) {
        handleError(updateError);
        return false;
      }

      if (updatedPackage) {
        setTransferPackage(updatedPackage);
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
      const { data: success, error: deleteError } = await deleteTransferPackage(packageId);

      if (deleteError) {
        handleError(deleteError);
        return false;
      }

      if (success) {
        setTransferPackage(null);
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
      const { data: packageData, error: loadError } = await getTransferPackage(id);

      if (loadError) {
        handleError(loadError);
        return false;
      }

      if (packageData) {
        setTransferPackage(packageData);
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

  const loadPackages = useCallback(async (filters: { status?: string } = {}): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to load packages');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: packagesData, error: loadError } = await listTransferPackages({
        operator_id: user.id,
        ...filters,
      });

      if (loadError) {
        handleError(loadError);
        return false;
      }

      if (packagesData) {
        setPackages(packagesData);
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
    package: transferPackage,
    packages,
    loading,
    saving,
    error,
    
    // Actions
    createPackage,
    updatePackage,
    deletePackage,
    loadPackage,
    loadPackages,
    
    // Utilities
    clearError,
    refresh,
  };
};

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for creating a new transfer package
 */
export const useCreateTransferPackage = () => {
  const { createPackage, saving, error, clearError } = useTransferPackage();
  
  return {
    createPackage,
    saving,
    error,
    clearError,
  };
};

/**
 * Hook for editing an existing transfer package
 */
export const useEditTransferPackage = (packageId: string) => {
  const { 
    package: transferPackage, 
    updatePackage, 
    deletePackage, 
    loadPackage, 
    loading, 
    saving, 
    error, 
    clearError,
    refresh 
  } = useTransferPackage({ packageId, autoLoad: true });
  
  return {
    package: transferPackage,
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
 * Hook for listing transfer packages
 */
export const useTransferPackageList = () => {
  const { 
    packages, 
    loadPackages, 
    loading, 
    error, 
    clearError, 
    refresh 
  } = useTransferPackage({ autoLoad: true });
  
  return {
    packages,
    loadPackages,
    loading,
    error,
    clearError,
    refresh,
  };
};

export default useTransferPackage;

