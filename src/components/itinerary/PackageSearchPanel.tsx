'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiPackage, FiLoader } from 'react-icons/fi';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Removed Supabase - using AWS-based API routes instead
import { PackageConfigModal } from './PackageConfigModal';

interface Package {
  id: string;
  title: string;
  destination_country: string;
  destination_city: string;
  package_type: 'activity' | 'transfer' | 'multi_city' | 'multi_city_hotel' | 'fixed_departure';
  operator_id: string;
  operator_name?: string;
  featured_image_url?: string;
  base_price?: number;
  currency?: string;
}

interface PackageSearchPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDestination: string;
  onDestinationChange: (dest: string) => void;
  itineraryId: string;
  onPackageAdded: (item: any) => void;
}

export function PackageSearchPanel({
  searchQuery,
  onSearchChange,
  selectedDestination,
  onDestinationChange,
  itineraryId,
  onPackageAdded,
}: PackageSearchPanelProps) {
  // Using AWS-based API routes instead of Supabase
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageTypes, setPackageTypes] = useState<string[]>(['activity', 'transfer', 'multi_city', 'multi_city_hotel', 'fixed_departure']);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    // Debounce package fetching to avoid excessive queries
    const timeoutId = setTimeout(() => {
      fetchPackages();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDestination, selectedType, searchQuery]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // Search across all package types using API routes
      const allPackages: Package[] = [];

      // Helper function to filter packages client-side
      const matchesFilter = (pkg: any, search: string, destination: string | null) => {
        const searchLower = search?.toLowerCase() || '';
        const destLower = destination?.toLowerCase() || '';
        
        if (searchLower && !pkg.title?.toLowerCase().includes(searchLower)) {
          return false;
        }
        
        if (destLower) {
          const destParts = destLower.split(',').map(d => d.trim());
          const matchesDest = destParts.some(part => 
            pkg.destination_country?.toLowerCase().includes(part) ||
            pkg.destination_city?.toLowerCase().includes(part) ||
            pkg.destination_region?.toLowerCase().includes(part)
          );
          if (!matchesDest) return false;
        }
        
        return true;
      };

      // Activity Packages
      if (selectedType === 'all' || selectedType === 'activity') {
        try {
          // Note: We'll need to create a search API or fetch all and filter client-side
          // For now, fetch from operator packages API (limited to 20 for performance)
          const response = await fetch('/api/packages/search?type=activity&limit=50');
          if (response.ok) {
            const data = await response.json();
            const packages = (data.packages || []).filter((p: any) => 
              p.status === 'published' && matchesFilter(p, searchQuery, selectedDestination)
            ).slice(0, 20);
            
            allPackages.push(...packages.map((p: any) => ({
              id: p.id,
              title: p.title,
              destination_country: p.destination_country || '',
              destination_city: p.destination_city || '',
              package_type: 'activity' as const,
              operator_id: p.operator_id,
              featured_image_url: p.featured_image_url,
              base_price: p.base_price || undefined,
              currency: p.currency || undefined,
            })));
          }
        } catch (err) {
          console.warn('Error fetching activity packages:', err);
        }
      }

      // Transfer Packages
      if (selectedType === 'all' || selectedType === 'transfer') {
        try {
          const response = await fetch('/api/packages/search?type=transfer&limit=50');
          if (response.ok) {
            const data = await response.json();
            const packages = (data.packages || []).filter((p: any) => 
              p.status === 'published' && matchesFilter(p, searchQuery, selectedDestination)
            ).slice(0, 20);
            
            allPackages.push(...packages.map((p: any) => ({
              id: p.id,
              title: p.title,
              destination_country: p.destination_country || '',
              destination_city: p.destination_city || '',
              package_type: 'transfer' as const,
              operator_id: p.operator_id,
              featured_image_url: p.featured_image_url,
              base_price: p.base_price || undefined,
              currency: p.currency || undefined,
            })));
          }
        } catch (err) {
          console.warn('Error fetching transfer packages:', err);
        }
      }

      // Multi-City Packages
      if (selectedType === 'all' || selectedType === 'multi_city') {
        try {
          const response = await fetch('/api/packages/multi-city');
          if (response.ok) {
            const data = await response.json();
            const packages = (data.packages || []).filter((p: any) => 
              matchesFilter(p, searchQuery, selectedDestination)
            ).slice(0, 20);
            
            allPackages.push(...packages.map((p: any) => ({
              id: p.id,
              title: p.title,
              destination_country: p.destination_region || '',
              destination_city: '',
              package_type: 'multi_city' as const,
              operator_id: p.operator_id,
              featured_image_url: p.featured_image_url,
              base_price: p.base_price || undefined,
              currency: p.currency || undefined,
            })));
          }
        } catch (err) {
          console.warn('Error fetching multi-city packages:', err);
        }
      }

      // Multi-City Hotel Packages
      if (selectedType === 'all' || selectedType === 'multi_city_hotel') {
        try {
          const response = await fetch('/api/packages/multi-city-hotel');
          if (response.ok) {
            const data = await response.json();
            const packages = (data.packages || []).filter((p: any) => 
              matchesFilter(p, searchQuery, selectedDestination)
            ).slice(0, 20);
            
            allPackages.push(...packages.map((p: any) => ({
              id: p.id,
              title: p.title,
              destination_country: p.destination_region || '',
              destination_city: '',
              package_type: 'multi_city_hotel' as const,
              operator_id: p.operator_id,
              featured_image_url: p.featured_image_url,
              base_price: p.base_price || undefined,
              currency: p.currency || undefined,
            })));
          }
        } catch (err) {
          console.warn('Error fetching multi-city hotel packages:', err);
        }
      }

      // Fixed Departure Packages
      if (selectedType === 'all' || selectedType === 'fixed_departure') {
        try {
          // Note: Need to create API route for fixed departure packages
          // For now, skip or use a placeholder
          // Fixed departure packages - fetch from API
          try {
            const response = await fetch('/api/packages/search?type=fixed_departure&limit=50');
            if (response.ok) {
              const data = await response.json();
              const packages = (data.packages || []).filter((p: any) => 
                matchesFilter(p, searchQuery, selectedDestination)
              ).slice(0, 20);
              
              allPackages.push(...packages.map((p: any) => ({
                id: p.id,
                title: p.title,
                destination_country: p.destination_region || '',
                destination_city: '',
                package_type: 'fixed_departure' as const,
                operator_id: p.operator_id,
                featured_image_url: p.featured_image_url,
                base_price: p.base_price || undefined,
                currency: p.currency || undefined,
              })));
            }
          } catch (err) {
            console.warn('Error fetching fixed departure packages:', err);
          }
        } catch (err) {
          console.warn('Error fetching fixed departure packages:', err);
        }
      }

      // Get operator names
      const operatorIds = [...new Set(allPackages.map(p => p.operator_id))];
      const operatorMap = new Map<string, string>();
      
      // Fetch operator info via API
      if (operatorIds.length > 0) {
        try {
          const response = await fetch('/api/operators');
          if (response.ok) {
            const { operators } = await response.json();
            if (operators) {
              operators.forEach((op: any) => {
                if (operatorIds.includes(op.id)) {
                  operatorMap.set(op.id, op.company_name || op.name || 'Unknown Operator');
                }
              });
            }
          }
        } catch (err) {
          console.warn('Error fetching operators:', err);
        }
      }

      // Fill in missing operators with default name
      operatorIds.forEach(id => {
        if (!operatorMap.has(id)) {
          operatorMap.set(id, 'Unknown Operator');
        }
      });

      setPackages(allPackages.map(p => ({
        ...p,
        operator_name: operatorMap.get(p.operator_id) || 'Unknown Operator',
      })));
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPackageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      activity: 'Activity',
      transfer: 'Transfer',
      multi_city: 'Multi-City',
      multi_city_hotel: 'Multi-City Hotel',
      fixed_departure: 'Fixed Departure',
    };
    return labels[type] || type;
  };

  const getPackageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      activity: 'bg-blue-100 text-blue-700',
      transfer: 'bg-green-100 text-green-700',
      multi_city: 'bg-purple-100 text-purple-700',
      multi_city_hotel: 'bg-pink-100 text-pink-700',
      fixed_departure: 'bg-orange-100 text-orange-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Packages</h2>

        {/* Search */}
        <div className="mb-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Package Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="multi_city">Multi-City</SelectItem>
                <SelectItem value="multi_city_hotel">Multi-City Hotel</SelectItem>
                <SelectItem value="fixed_departure">Fixed Departure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Destination</label>
            <Input
              placeholder="Country or city..."
              value={selectedDestination}
              onChange={(e) => onDestinationChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Package List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FiLoader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiPackage className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No packages found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPackage(pkg)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {pkg.featured_image_url && (
                      <img
                        src={pkg.featured_image_url}
                        alt={pkg.title}
                        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">
                          {pkg.title}
                        </h3>
                        <Badge className={`text-xs flex-shrink-0 ${getPackageTypeColor(pkg.package_type)}`}>
                          {getPackageTypeLabel(pkg.package_type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {pkg.destination_city && `${pkg.destination_city}, `}
                        {pkg.destination_country}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{pkg.operator_name}</p>
                        {pkg.base_price && (
                          <p className="text-sm font-semibold text-green-600">
                            ${pkg.base_price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Package Configuration Modal */}
      {selectedPackage && (
        <PackageConfigModal
          package={selectedPackage}
          itineraryId={itineraryId}
          onClose={() => setSelectedPackage(null)}
          onPackageAdded={(item) => {
            onPackageAdded(item);
            setSelectedPackage(null);
          }}
          onNavigateToConfigure={(itemId) => {
            // Navigate using window.location since we don't have router here
            window.location.href = `/agent/itineraries/${itineraryId}/configure/${itemId}`;
          }}
        />
      )}
    </div>
  );
}

