/**
 * Transfer Packages API Service
 * Wrapper for API routes backed by AWS RDS (via Lambda)
 */

import type { TransferPackageFormData } from '@/lib/types/transfer-package';
import {
  formDataToDatabase,
  databaseToFormData,
  type TransferPackageWithRelationsDB as TransferPackageWithRelations,
  type CreateTransferPackageDataDB as CreateTransferPackageData,
} from '@/lib/transfer-packages-mapper';

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Create a transfer package
 */
export async function createTransferPackage(
  data: CreateTransferPackageData,
  userId: string
): Promise<{ data: TransferPackageWithRelations | null; error: ApiError | null }> {
  try {
    const response = await fetch('/api/operator/packages/transfer/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { ...data.package, operator_id: userId },
        images: data.images || [],
        vehicles: data.vehicles || [],
        vehicleImages: data.vehicleImages || [],
        stops: data.stops || [],
        additional_services: data.additional_services || [],
        hourly_pricing: data.hourly_pricing || [],
        point_to_point_pricing: data.point_to_point_pricing || [],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        data: null,
        error: {
          message: error.error || 'Failed to create transfer package',
          details: error.details,
        },
      };
    }

    const result = await response.json();
    return { data: result.data || result, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to create transfer package',
      },
    };
  }
}

/**
 * Get a transfer package by ID (via Lambda-backed API route)
 */
export async function getTransferPackage(
  id: string
): Promise<{ data: TransferPackageWithRelations | null; error: ApiError | null }> {
  try {
    const response = await fetch(`/api/operator/packages/transfer/${id}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        data: null,
        error: {
          message: error.error || 'Failed to fetch transfer package',
          details: error.details,
        },
      };
    }

    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to fetch transfer package',
      },
    };
  }
}

/**
 * Update a transfer package
 */
export async function updateTransferPackage(
  id: string,
  data: CreateTransferPackageData
): Promise<{ data: TransferPackageWithRelations | null; error: ApiError | null }> {
  try {
    const response = await fetch('/api/operator/packages/transfer/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: id,
        package: data.package,
        images: data.images || [],
        vehicles: data.vehicles || [],
        vehicleImages: data.vehicleImages || [],
        stops: data.stops || [],
        additional_services: data.additional_services || [],
        hourly_pricing: data.hourly_pricing || [],
        point_to_point_pricing: data.point_to_point_pricing || [],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        data: null,
        error: {
          message: error.error || 'Failed to update transfer package',
          details: error.details,
        },
      };
    }

    const result = await response.json();
    return { data: result.data || result, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to update transfer package',
      },
    };
  }
}

/**
 * List transfer packages
 */
export async function listTransferPackages(
  filters: { operator_id?: string; status?: string } = {}
): Promise<{ data: TransferPackageWithRelations[] | null; error: ApiError | null }> {
  try {
    const params = new URLSearchParams();
    if (filters.operator_id) {
      params.append('operatorId', filters.operator_id);
    }

    const response = await fetch(`/api/operator/packages?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        data: null,
        error: {
          message: error.error || 'Failed to fetch transfer packages',
          details: error.details,
        },
      };
    }

    const result = await response.json();
    const transferPackages = Array.isArray(result.transferPackages) ? result.transferPackages : [];
    
    // Transform to match expected format
    const packages: TransferPackageWithRelations[] = transferPackages.map((pkg: any) => ({
      ...pkg,
      images: pkg.images || [],
      vehicles: pkg.vehicles || [],
      stops: [],
      additional_services: [],
      hourly_pricing: pkg.hourly_pricing || [],
      point_to_point_pricing: pkg.point_to_point_pricing || [],
    }));

    return { data: packages, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to fetch transfer packages',
      },
    };
  }
}

/**
 * Delete a transfer package
 */
export async function deleteTransferPackage(
  id: string
): Promise<{ data: boolean | null; error: ApiError | null }> {
  try {
    const response = await fetch(`/api/operator/packages/transfer/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        data: null,
        error: {
          message: error.error || 'Failed to delete transfer package',
          details: error.details,
        },
      };
    }

    return { data: true, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to delete transfer package',
      },
    };
  }
}

// Re-export utility functions from the old file (they don't use Supabase client)
export { formDataToDatabase, databaseToFormData };
