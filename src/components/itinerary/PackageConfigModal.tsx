'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiUsers, FiDollarSign } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';

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

interface PackageConfigModalProps {
  package: Package;
  itineraryId: string;
  onClose: () => void;
  onPackageAdded: (item: any) => void;
}

export function PackageConfigModal({
  package: pkg,
  itineraryId,
  onClose,
  onPackageAdded,
}: PackageConfigModalProps) {
  const supabase = createClient();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [packageData, setPackageData] = useState<any>(null);
  const [config, setConfig] = useState<any>({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [itineraryInfo, setItineraryInfo] = useState<any>(null);

  // Fetch itinerary info (adults, children, infants)
  useEffect(() => {
    const fetchItinerary = async () => {
      const { data } = await supabase
        .from('itineraries' as any)
        .select('adults_count, children_count, infants_count, currency')
        .eq('id', itineraryId)
        .single();

      if (data) {
        setItineraryInfo(data);
      }
    };

    fetchItinerary();
  }, [itineraryId, supabase]);

  // Fetch package details
  useEffect(() => {
    const fetchPackage = async () => {
      setLoading(true);
      try {
        let query: any;
        
        if (pkg.package_type === 'activity') {
          // Fetch activity package and its pricing packages
          const { data: packageData, error: packageError } = await supabase
            .from('activity_packages')
            .select('*')
            .eq('id', pkg.id)
            .single();

          if (packageError) throw packageError;

          // Fetch pricing packages
          const pricingTable = 'activity_pricing_packages' as any;
          const { data: pricingData, error: pricingError } = await supabase
            .from(pricingTable)
            .select('*')
            .eq('package_id', pkg.id)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (pricingError && pricingError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.warn('Error fetching pricing packages:', pricingError);
          }

          setPackageData({
            ...packageData,
            pricing_packages: (pricingData || []) as any[],
          });

          // Initialize default config
          const pricingArray = (pricingData || []) as any[];
          setConfig({
            packageType: 'TICKET_ONLY',
            selectedPricingPackageId: pricingArray[0]?.id || null,
            selectedVehicle: null,
            quantity: 1,
          });
          setLoading(false);
          return;
        } else if (pkg.package_type === 'transfer') {
          query = supabase.from('transfer_packages').select('*').eq('id', pkg.id).single();
        } else if (pkg.package_type === 'multi_city') {
          query = supabase.from('multi_city_packages').select('*').eq('id', pkg.id).single();
        } else if (pkg.package_type === 'multi_city_hotel') {
          query = supabase.from('multi_city_hotel_packages' as any).select('*').eq('id', pkg.id).single();
        } else if (pkg.package_type === 'fixed_departure') {
          query = supabase.from('fixed_departure_flight_packages' as any).select('*').eq('id', pkg.id).single();
        } else {
          throw new Error('Unknown package type');
        }

        const { data, error } = await query;

        if (error) throw error;
        if (data) {
          setPackageData(data);
          
          // Initialize default config based on package type
          if (pkg.package_type === 'transfer') {
            setConfig({
              pricingType: 'point-to-point',
              selectedOption: null,
              hours: 1,
              quantity: 1,
            });
          } else if (pkg.package_type === 'multi_city' || pkg.package_type === 'multi_city_hotel' || pkg.package_type === 'fixed_departure') {
            setConfig({
              pricingType: data.pricing?.pricing_type || 'STANDARD',
              selectedVehicle: null,
              selectedHotels: [],
              quantity: 1,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching package:', err);
        toast.error('Failed to load package details');
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [pkg.id, pkg.package_type, supabase, toast]);

  // Calculate price in real-time
  useEffect(() => {
    if (!packageData || !itineraryInfo) return;

    let price = 0;

    if (pkg.package_type === 'activity') {
      // Use pricing from activity_pricing_packages table
      const pricingPackages = packageData.pricing_packages || [];
      const selectedPricingPackage = pricingPackages.find((p: any) => p.id === config.selectedPricingPackageId);
      
      if (selectedPricingPackage) {
        const adultsPrice = (selectedPricingPackage.adult_price || 0) * (itineraryInfo.adults_count || 0);
        const childrenPrice = (selectedPricingPackage.child_price || 0) * (itineraryInfo.children_count || 0);
        const infantsPrice = (selectedPricingPackage.infant_price || 0) * (itineraryInfo.infants_count || 0);
        price = adultsPrice + childrenPrice + infantsPrice;
        
        // Add transfer price if included
        if (selectedPricingPackage.transfer_included) {
          const transferAdultPrice = (selectedPricingPackage.transfer_price_adult || 0) * (itineraryInfo.adults_count || 0);
          const transferChildPrice = (selectedPricingPackage.transfer_price_child || 0) * (itineraryInfo.children_count || 0);
          const transferInfantPrice = (selectedPricingPackage.transfer_price_infant || 0) * (itineraryInfo.infants_count || 0);
          price += transferAdultPrice + transferChildPrice + transferInfantPrice;
        }
      } else if (packageData.base_price) {
        // Fallback to base_price if no pricing packages
        price = (packageData.base_price || 0) * ((itineraryInfo.adults_count || 0) + (itineraryInfo.children_count || 0));
      }
    } else if (pkg.package_type === 'transfer') {
      // Transfer packages use base_price directly
      if (packageData.base_price) {
        price = (packageData.base_price || 0) * (config.quantity || 1);
      }
    } else if (pkg.package_type === 'multi_city' || pkg.package_type === 'multi_city_hotel' || pkg.package_type === 'fixed_departure') {
      // Multi-city packages use adult_price directly from the table
      const adultsPrice = (packageData.adult_price || 0) * (itineraryInfo.adults_count || 0);
      const childrenPrice = 0; // Multi-city packages typically don't have child pricing
      const infantsPrice = 0;
      price = adultsPrice + childrenPrice + infantsPrice;
      
      // Note: Vehicle and hotel pricing will be added when those features are implemented
    }

    setCalculatedPrice(price * (config.quantity || 1));
  }, [config, packageData, itineraryInfo, pkg.package_type]);

  const handleAddToItinerary = async () => {
    if (!packageData) return;

    setLoading(true);
    try {
      // Create itinerary item
      const { data: item, error } = await supabase
        .from('itinerary_items' as any)
        .insert({
          itinerary_id: itineraryId,
          day_id: null, // Unassigned initially
          package_type: pkg.package_type,
          package_id: pkg.id,
          operator_id: pkg.operator_id,
          package_title: pkg.title,
          package_image_url: pkg.featured_image_url,
          configuration: config,
          unit_price: calculatedPrice / (config.quantity || 1),
          quantity: config.quantity || 1,
          total_price: calculatedPrice,
          display_order: 0,
        })
        .select()
        .single();

      if (error) throw error;

      onPackageAdded(item);
      toast.success('Package added to itinerary');
      onClose();
    } catch (err) {
      console.error('Error adding package:', err);
      toast.error('Failed to add package to itinerary');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !packageData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading package details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{pkg.title}</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {pkg.destination_city && `${pkg.destination_city}, `}
            {pkg.destination_country} • {pkg.operator_name}
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Activity Package Configuration */}
          {pkg.package_type === 'activity' && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Package Option</Label>
                {(() => {
                  // Use pricing packages from activity_pricing_packages table
                  const pricingPackages = packageData?.pricing_packages || [];
                  
                  // Fallback: create a default option from base_price if no pricing packages
                  if (pricingPackages.length === 0 && packageData?.base_price) {
                    const defaultOption = {
                      id: 'default',
                      package_name: pkg.title,
                      adult_price: packageData.base_price,
                      child_price: packageData.base_price * 0.7, // Estimate
                      child_min_age: 3,
                      child_max_age: 12,
                      transfer_included: false,
                    };
                    pricingPackages.push(defaultOption);
                  }

                  if (pricingPackages.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No pricing options available for this package</p>
                        <p className="text-xs text-gray-400 mt-2">Using base price: ${packageData?.base_price?.toFixed(2) || '0.00'}</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <RadioGroup
                        value={config.selectedPricingPackageId || pricingPackages[0]?.id || ''}
                        onValueChange={(value) => {
                          const selectedPkg = pricingPackages.find((p: any) => p.id === value);
                          setConfig({
                            ...config,
                            selectedPricingPackageId: value,
                            packageType: selectedPkg?.transfer_included ? 'PRIVATE_TRANSFER' : 'TICKET_ONLY',
                            selectedVehicle: null,
                          });
                        }}
                      >
                        {pricingPackages.map((pkgOption: any) => (
                          <div key={pkgOption.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value={pkgOption.id} id={pkgOption.id} className="mt-1" />
                            <Label htmlFor={pkgOption.id} className="flex-1 cursor-pointer">
                              <div className="font-medium">{pkgOption.package_name || 'Option'}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {pkgOption.transfer_included ? (pkgOption.transfer_type === 'SHARED' ? 'Shared Transfer' : 'Private Transfer') : 'Ticket Only'}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-600">
                                  Adult: ${(pkgOption.adult_price || 0).toFixed(2)}
                                </span>
                                <span className="text-gray-600">
                                  Child: ${(pkgOption.child_price || 0).toFixed(2)}
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {/* Vehicle Selection for Private Transfer */}
                      {(() => {
                        const selectedPkg = pricingPackages.find((p: any) => p.id === config.selectedPricingPackageId);
                        if (config.packageType === 'PRIVATE_TRANSFER' && selectedPkg?.transfer_included && selectedPkg?.transfer_type === 'PRIVATE') {
                          // Note: Vehicles for private transfers need to be fetched from a separate table
                          // For now, transfer pricing is included in the pricing package
                          return null;
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Transfer Package Configuration */}
          {pkg.package_type === 'transfer' && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Transfer Details</Label>
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Base Price</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {packageData?.base_price ? `$${packageData.base_price.toFixed(2)}` : 'Not set'}
                    </span>
                  </div>
                  {packageData?.destination_name && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Destination</span>
                      <span className="text-sm font-medium">{packageData.destination_name}</span>
                    </div>
                  )}
                  {packageData?.transfer_type && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Transfer Type</span>
                      <Badge>{packageData.transfer_type}</Badge>
                    </div>
                  )}
                  {packageData?.estimated_duration_hours && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-medium">
                        {packageData.estimated_duration_hours}h {packageData.estimated_duration_minutes || 0}m
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity Input */}
                <div className="mt-4">
                  <Label htmlFor="transfer-quantity">Quantity</Label>
                  <Input
                    id="transfer-quantity"
                    type="number"
                    min="1"
                    value={config.quantity || 1}
                    onChange={(e) => setConfig({ ...config, quantity: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Multi-City Package Configuration */}
          {(pkg.package_type === 'multi_city' || pkg.package_type === 'multi_city_hotel' || pkg.package_type === 'fixed_departure') && packageData && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Package Details</Label>
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Adult Price (per person)</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {packageData?.adult_price ? `$${packageData.adult_price.toFixed(2)}` : 'Not set'}
                    </span>
                  </div>
                  {packageData?.destination_region && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Destination Region</span>
                      <span className="text-sm font-medium">{packageData.destination_region}</span>
                    </div>
                  )}
                  {packageData?.total_days && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-medium">{packageData.total_days} days / {packageData.total_nights || 0} nights</span>
                    </div>
                  )}
                  {packageData?.total_cities && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cities</span>
                      <span className="text-sm font-medium">{packageData.total_cities} cities</span>
                    </div>
                  )}
                </div>

                {/* Quantity Input */}
                <div className="mt-4">
                  <Label htmlFor="multicity-quantity">Quantity</Label>
                  <Input
                    id="multicity-quantity"
                    type="number"
                    min="1"
                    value={config.quantity || 1}
                    onChange={(e) => setConfig({ ...config, quantity: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={config.quantity || 1}
              onChange={(e) => setConfig({ ...config, quantity: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>

          {/* Price Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Total Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${calculatedPrice.toFixed(2)}
                  </p>
                  {config.quantity > 1 && (
                    <p className="text-xs text-gray-600 mt-1">
                      ${(calculatedPrice / config.quantity).toFixed(2)} × {config.quantity || 1}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Based on:</p>
                  <p>{itineraryInfo?.adults_count || 0} Adults</p>
                  <p>{itineraryInfo?.children_count || 0} Children</p>
                  <p>{itineraryInfo?.infants_count || 0} Infants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToItinerary}
              disabled={loading || calculatedPrice === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {loading ? 'Adding...' : 'Add to Itinerary'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

