'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiPackage, FiLoader } from 'react-icons/fi';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageTypes, setPackageTypes] = useState<string[]>(['activity', 'transfer', 'multi_city', 'multi_city_hotel', 'fixed_departure']);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDestination, selectedType, searchQuery]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // Search across all package types
      const allPackages: Package[] = [];

      // Activity Packages
      if (selectedType === 'all' || selectedType === 'activity') {
        let query = supabase
          .from('activity_packages')
          .select('id, title, destination_country, destination_city, operator_id, featured_image_url, base_price, currency, status')
          .eq('status', 'published');

        if (selectedDestination) {
          query = query.or(`destination_country.ilike.%${selectedDestination}%,destination_city.ilike.%${selectedDestination}%`);
        }

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`);
        }

        const { data } = await query.limit(20);
        if (data) {
          const packagesTyped = data as unknown as Array<{ id: string; title: string; destination_country: string; destination_city: string; operator_id: string; featured_image_url: string | null; base_price: number | null; currency: string | null }>;
          allPackages.push(...packagesTyped.map(p => ({
            id: p.id,
            title: p.title,
            destination_country: p.destination_country,
            destination_city: p.destination_city,
            package_type: 'activity' as const,
            operator_id: p.operator_id,
            featured_image_url: p.featured_image_url || undefined,
            base_price: p.base_price || undefined,
            currency: p.currency || undefined,
          })));
        }
      }

      // Transfer Packages
      if (selectedType === 'all' || selectedType === 'transfer') {
        let query = supabase
          .from('transfer_packages')
          .select('id, title, destination_country, destination_city, operator_id, featured_image_url, base_price, currency, status')
          .eq('status', 'published');

        if (selectedDestination) {
          query = query.or(`destination_country.ilike.%${selectedDestination}%,destination_city.ilike.%${selectedDestination}%`);
        }

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`);
        }

        const { data } = await query.limit(20);
        if (data) {
          const packagesTyped = data as unknown as Array<{ id: string; title: string; destination_country: string; destination_city: string; operator_id: string; featured_image_url: string | null; base_price: number | null; currency: string | null }>;
          allPackages.push(...packagesTyped.map(p => ({
            id: p.id,
            title: p.title,
            destination_country: p.destination_country,
            destination_city: p.destination_city,
            package_type: 'transfer' as const,
            operator_id: p.operator_id,
            featured_image_url: p.featured_image_url || undefined,
            base_price: p.base_price || undefined,
            currency: p.currency || undefined,
          })));
        }
      }

      // Multi-City Packages
      if (selectedType === 'all' || selectedType === 'multi_city') {
        let query = supabase
          .from('multi_city_packages')
          .select('id, title, destination_region, operator_id, featured_image_url, adult_price, currency, status')
          .eq('status', 'published');

        if (selectedDestination) {
          query = query.ilike('destination_region', `%${selectedDestination}%`);
        }

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`);
        }

        const { data } = await query.limit(20);
        if (data) {
          const packagesTyped = data as unknown as Array<{ id: string; title: string; destination_region: string | null; operator_id: string; featured_image_url: string | null; adult_price: number | null; currency: string | null }>;
          allPackages.push(...packagesTyped.map(p => ({
            id: p.id,
            title: p.title,
            destination_country: p.destination_region || '',
            destination_city: '',
            package_type: 'multi_city' as const,
            operator_id: p.operator_id,
            featured_image_url: p.featured_image_url || undefined,
            base_price: p.adult_price || undefined,
            currency: p.currency || undefined,
          })));
        }
      }

      // Multi-City Hotel Packages
      if (selectedType === 'all' || selectedType === 'multi_city_hotel') {
        let query = supabase
          .from('multi_city_hotel_packages' as any)
          .select('id, title, destination_region, operator_id, featured_image_url, adult_price, currency, status')
          .eq('status', 'published');

        if (selectedDestination) {
          query = query.ilike('destination_region', `%${selectedDestination}%`);
        }

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`);
        }

        const { data } = await query.limit(20);
        if (data) {
          const packagesTyped = data as unknown as Array<{ id: string; title: string; destination_region: string | null; operator_id: string; featured_image_url: string | null; adult_price: number | null; currency: string | null }>;
          allPackages.push(...packagesTyped.map(p => ({
            id: p.id,
            title: p.title,
            destination_country: p.destination_region || '',
            destination_city: '',
            package_type: 'multi_city_hotel' as const,
            operator_id: p.operator_id,
            featured_image_url: p.featured_image_url || undefined,
            base_price: p.adult_price || undefined,
            currency: p.currency || undefined,
          })));
        }
      }

      // Fixed Departure Packages
      if (selectedType === 'all' || selectedType === 'fixed_departure') {
        let query = supabase
          .from('fixed_departure_flight_packages' as any)
          .select('id, title, destination_region, operator_id, featured_image_url, adult_price, currency, status')
          .eq('status', 'published');

        if (selectedDestination) {
          query = query.ilike('destination_region', `%${selectedDestination}%`);
        }

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`);
        }

        const { data } = await query.limit(20);
        if (data) {
          const packagesTyped = data as unknown as Array<{ id: string; title: string; destination_region: string | null; operator_id: string; featured_image_url: string | null; adult_price: number | null; currency: string | null }>;
          allPackages.push(...packagesTyped.map(p => ({
            id: p.id,
            title: p.title,
            destination_country: p.destination_region || '',
            destination_city: '',
            package_type: 'fixed_departure' as const,
            operator_id: p.operator_id,
            featured_image_url: p.featured_image_url || undefined,
            base_price: p.adult_price || undefined,
            currency: p.currency || undefined,
          })));
        }
      }

      // Get operator names - Try to get from auth.users or use email as fallback
      const operatorIds = [...new Set(allPackages.map(p => p.operator_id))];
      
      // Try to get operator info - if profiles table doesn't exist, use fallback
      let operatorMap = new Map<string, string>();
      try {
        const { data: operators } = await supabase
          .from('profiles' as any)
          .select('id, company_name')
          .in('id', operatorIds);

        if (operators) {
          const operatorsTyped = operators as unknown as Array<{ id: string; company_name: string | null }>;
          operatorMap = new Map(operatorsTyped.map(o => [o.id, o.company_name || 'Unknown Operator']));
        }
      } catch (err) {
        // Profiles table might not exist, use default
        console.warn('Profiles table not found, using default operator names');
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
        />
      )}
    </div>
  );
}

