'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiShoppingBag,
  FiMail,
  FiPhone,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiStar,
  FiRefreshCw,
  FiPackage,
} from 'react-icons/fi';
import { FaPlane, FaHiking, FaUmbrellaBeach, FaPaw, FaGem, FaMoneyBillWave, FaUsers, FaHeart } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// MarketplaceService now accessed via API routes
import type { LeadPurchase } from '@/lib/types/marketplace';
import { TripType } from '@/lib/types/marketplace';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
// queryService now accessed via API routes
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Trip type icon mapping
const getTripTypeIcon = (tripType: TripType) => {
  const icons = {
    [TripType.ADVENTURE]: FaHiking,
    [TripType.CULTURAL]: FaPlane,
    [TripType.BEACH]: FaUmbrellaBeach,
    [TripType.WILDLIFE]: FaPaw,
    [TripType.LUXURY]: FaGem,
    [TripType.BUDGET]: FaMoneyBillWave,
    [TripType.FAMILY]: FaUsers,
    [TripType.HONEYMOON]: FaHeart,
  };
  return icons[tripType] || FaPlane;
};

// Trip type color mapping
const getTripTypeColor = (tripType: TripType) => {
  const colors = {
    [TripType.ADVENTURE]: 'orange',
    [TripType.CULTURAL]: 'purple',
    [TripType.BEACH]: 'blue',
    [TripType.WILDLIFE]: 'green',
    [TripType.LUXURY]: 'yellow',
    [TripType.BUDGET]: 'gray',
    [TripType.FAMILY]: 'pink',
    [TripType.HONEYMOON]: 'red',
  };
  return colors[tripType] || 'gray';
};

// Loading skeleton
function LeadCardSkeleton() {
  return (
    <Card className="border-gray-200 animate-pulse">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Purchased lead card component
function PurchasedLeadCard({ 
  purchase, 
  onCreateItinerary 
}: { 
  purchase: LeadPurchase;
  onCreateItinerary: (leadId: string) => void;
}) {
  const { lead } = purchase;
  if (!lead) return null;

  const TripIcon = getTripTypeIcon(lead.tripType);
  const tripColor = getTripTypeColor(lead.tripType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full max-h-[850px]">
        {/* Header with trip type */}
        <div className={`bg-gradient-to-r from-${tripColor}-500 to-${tripColor}-600 p-4 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <TripIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  {lead.tripType.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <Badge className="bg-green-500 text-white border-0">
              Purchased
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 flex flex-col flex-grow overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            {/* Title and destination */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{lead.title}</h3>
              <div className="flex items-center gap-2 text-gray-600">
                <FiMapPin className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">{lead.destination}</span>
              </div>
            </div>

            {/* Lead details */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiDollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="truncate">
                  ${lead.budgetMin.toLocaleString()} - ${lead.budgetMax.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiCalendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>{lead.durationDays} days</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiUser className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>{lead.travelersCount} travelers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiStar className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span>Quality: {lead.leadQualityScore}/100</span>
              </div>
            </div>

            {/* Customer contact information - NOW VISIBLE */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-500 text-white rounded-full p-1">
                  <FiUser className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-gray-900">Customer Contact Details</h4>
              </div>
              <div className="space-y-2">
                {lead.customerName && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiUser className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{lead.customerName}</span>
                  </div>
                )}
                {lead.customerEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiMail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <a 
                      href={`mailto:${lead.customerEmail}`}
                      className="text-blue-600 hover:text-blue-800 font-medium truncate"
                    >
                      {lead.customerEmail}
                    </a>
                  </div>
                )}
                {lead.customerPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiPhone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <a 
                      href={`tel:${lead.customerPhone}`}
                      className="text-blue-600 hover:text-blue-800 font-medium truncate"
                    >
                      {lead.customerPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Special requirements */}
            {lead.specialRequirements && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Special Requirements:</h4>
                <p className="text-sm text-gray-600 line-clamp-3">{lead.specialRequirements}</p>
              </div>
            )}

            {/* Purchase info */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Purchased on {new Date(purchase.purchasedAt).toLocaleDateString()}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                Paid: ${purchase.purchasePrice}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 flex-shrink-0">
            <Button 
              onClick={() => onCreateItinerary(lead.id)}
              className="w-full flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <FiPackage className="w-4 h-4 mr-2" />
              Create Itinerary
            </Button>
            {lead.customerEmail && (
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                onClick={() => window.location.href = `mailto:${lead.customerEmail}`}
              >
                <FiMail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            )}
            {lead.customerPhone && (
              <Button 
                variant="outline"
                className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => window.location.href = `tel:${lead.customerPhone}`}
              >
                <FiPhone className="w-4 h-4 mr-2" />
                Call
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-full p-8 mb-6">
        <FiPackage className="w-20 h-20 text-blue-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Purchased Leads Yet</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        You haven&apos;t purchased any leads from the marketplace yet. Browse the marketplace to find quality leads for your business.
      </p>
      <Link href="/agent/marketplace">
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
          <FiShoppingBag className="w-4 h-4 mr-2" />
          Browse Marketplace
        </Button>
      </Link>
    </motion.div>
  );
}

export default function MyLeadsPage() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const router = useRouter();
  
  const [purchases, setPurchases] = useState<LeadPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchasedLeads = async () => {
    const agentId = user?.id;
    if (!agentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/marketplace/purchased?agentId=${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch purchased leads');
      const { purchases: data } = await response.json();
      setPurchases(data);
    } catch (err) {
      console.error('Error fetching purchased leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      toast.error('Failed to load your purchased leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasedLeads();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Create Itinerary button click
  const handleCreateItinerary = async (leadId: string) => {
    if (!user?.id) return;
    // Navigate directly to lead detail page - query form will appear when card is clicked
    router.push(`/agent/leads/${leadId}`);
  };

  // Handle query save
  const handleQuerySave = async (data: {
    destinations: Array<{ city: string; nights: number }>;
    leaving_from: string;
    nationality: string;
    leaving_on: string;
    travelers: { rooms: number; adults: number; children: number; infants: number };
    star_rating?: number;
    add_transfers: boolean;
  }) => {
    if (!user?.id || !selectedLeadId) return;

    setQueryLoading(true);
    try {
      const response = await fetch(`/api/queries/${selectedLeadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: user.id,
          destinations: data.destinations,
          leaving_from: data.leaving_from,
          nationality: data.nationality,
          leaving_on: data.leaving_on,
          travelers: data.travelers,
          star_rating: data.star_rating,
          add_transfers: data.add_transfers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save query');
      }

      toast.success('Query saved successfully!');
      
      // Save leadId before clearing state
      const savedLeadId = selectedLeadId;
      
      setQueryModalOpen(false);
      setSelectedLeadId(null);
      
      // Navigate to lead detail page
      router.push(`/agent/leads/${savedLeadId}`);
    } catch (err) {
      console.error('Error saving query:', err);
      toast.error('Failed to save query. Please try again.');
      throw err;
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Purchased Leads</h1>
              <p className="text-blue-100 text-lg">
                View and manage your leads purchased from the marketplace
              </p>
            </div>
            <Button
              onClick={fetchPurchasedLeads}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <FiRefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-blue-50">
                    <FiShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Purchased</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-purple-50">
                    <FiDollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${purchases.reduce((sum, p) => {
                        const price = typeof p.purchasePrice === 'number' 
                          ? p.purchasePrice 
                          : parseFloat(String(p.purchasePrice)) || 0;
                        return sum + price;
                      }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Total Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-green-50">
                    <FiStar className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {purchases.length > 0
                        ? Math.round(
                            purchases.reduce((sum, p) => sum + (p.lead?.leadQualityScore || 0), 0) /
                              purchases.length
                          )
                        : 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Avg Quality Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <LeadCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="bg-red-100 rounded-full p-4 mb-4">
                  <FiPackage className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Leads</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button 
                  onClick={fetchPurchasedLeads}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && purchases.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <EmptyState />
            </CardContent>
          </Card>
        )}

        {/* Leads Grid */}
        {!loading && !error && purchases.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Your Purchased Leads ({purchases.length})
              </h2>
              <Link href="/agent/marketplace">
                <Button 
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <FiShoppingBag className="w-4 h-4 mr-2" />
                  Browse More Leads
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {purchases.map((purchase, index) => (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index % 6) }}
                >
                  <PurchasedLeadCard 
                    purchase={purchase} 
                    onCreateItinerary={handleCreateItinerary}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

