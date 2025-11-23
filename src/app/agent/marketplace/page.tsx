'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiFilter,
  FiRefreshCw,
  FiPackage,
  FiAlertCircle,
} from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LeadCard, LeadFilters, PurchaseConfirmationModal } from '@/components/marketplace';
import { MarketplaceService } from '@/lib/services/marketplaceService';
import type { MarketplaceLead, LeadFilters as LeadFiltersType } from '@/lib/types/marketplace';
import { LeadStatus } from '@/lib/types/marketplace';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';

// Loading skeleton component
function LeadCardSkeleton() {
  return (
    <Card className="border-gray-200 animate-pulse">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Stats card component
function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  color 
}: { 
  icon: React.ElementType; 
  title: string; 
  value: string | number; 
  color: string;
}) {
  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl bg-${color}-50`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600 mt-1">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
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
      <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-full p-6 mb-6">
        <FiPackage className="w-16 h-16 text-[#FF6B35]" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Leads Found</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        No leads match your current filters. Try adjusting your search criteria or check back later for new opportunities.
      </p>
      <Button 
        onClick={() => window.location.reload()}
        className="bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] hover:from-[#E05A2A] hover:to-[#E04080] text-white"
      >
        <FiRefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </motion.div>
  );
}

// Error state component
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="bg-red-50 rounded-full p-6 mb-6">
        <FiAlertCircle className="w-16 h-16 text-red-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        We couldn&apos;t load the marketplace leads. Please try again.
      </p>
      <Button 
        onClick={onRetry}
        className="bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] hover:from-[#E05A2A] hover:to-[#E04080] text-white"
      >
        <FiRefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const toast = useToast();
  
  // State management
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeadFiltersType>({ status: LeadStatus.AVAILABLE });
  const [selectedLead, setSelectedLead] = useState<MarketplaceLead | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'quality'>('newest');
  
  // Stats state
  const [stats, setStats] = useState({
    availableLeads: 0,
    purchasedLeads: 0,
    totalSpent: 0,
  });

  // Fetch leads function
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await MarketplaceService.getAvailableLeads(filters);
      
      // Sort leads based on selected sort option
      const sortedData = [...data];
      switch (sortBy) {
        case 'newest':
          sortedData.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
          break;
        case 'price':
          sortedData.sort((a, b) => a.leadPrice - b.leadPrice);
          break;
        case 'quality':
          sortedData.sort((a, b) => b.leadQualityScore - a.leadQualityScore);
          break;
      }
      
      setLeads(sortedData);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      toast.error('Failed to load marketplace leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats function
  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const [marketplaceStats, purchasedLeads] = await Promise.all([
        MarketplaceService.getMarketplaceStats(user.id),
        MarketplaceService.getAgentPurchasedLeads(user.id),
      ]);
      
      const totalSpent = purchasedLeads.reduce((sum, purchase) => sum + purchase.purchasePrice, 0);
      
      setStats({
        availableLeads: marketplaceStats.totalAvailable,
        purchasedLeads: purchasedLeads.length,
        totalSpent,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [filters, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter changes
  const handleFiltersChange = (newFilters: LeadFiltersType) => {
    setFilters(newFilters);
  };

  // Handle filter reset
  const handleFiltersReset = () => {
    setFilters({ status: LeadStatus.AVAILABLE });
  };

  // Handle lead view details
  const handleViewDetails = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setIsPurchaseModalOpen(true);
    }
  };

  // Handle lead purchase
  const handlePurchase = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setIsPurchaseModalOpen(true);
    }
  };

  // Handle purchase confirmation
  const handlePurchaseConfirm = async () => {
    if (!selectedLead || !user) return;
    
    setIsPurchasing(true);
    
    try {
      await MarketplaceService.purchaseLead(selectedLead.id, user.id);
      
      toast.success(
        `You have successfully purchased the lead "${selectedLead.title}". Check your purchased leads.`
      );
      
      // Refresh leads and stats
      await Promise.all([fetchLeads(), fetchStats()]);
      
      // Close modal
      setIsPurchaseModalOpen(false);
      setSelectedLead(null);
    } catch (err) {
      console.error('Error purchasing lead:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to purchase lead. Please try again.'
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-pink-50/30">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold mb-2">Lead Marketplace</h1>
              <p className="text-orange-100 text-lg">
                Browse and purchase quality leads to grow your business
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              icon={FiShoppingBag}
              title="Available Leads"
              value={stats.availableLeads}
              color="blue"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              icon={FiTrendingUp}
              title="Your Purchases"
              value={stats.purchasedLeads}
              color="green"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatCard
              icon={FiDollarSign}
              title="Total Spent"
              value={`$${stats.totalSpent.toLocaleString()}`}
              color="orange"
            />
          </motion.div>
        </div>

        {/* Single Column Layout */}
        <div>
          {/* Filters Bar - Replaces Search Bar */}
          {/* COMMENTED OUT - Filter section removed per user request
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <Card className="border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 pb-4">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <FiFilter className="w-5 h-5 text-[#FF6B35]" />
                    Filters
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFiltersReset}
                    className="text-[#FF6B35] hover:text-[#E05A2A]"
                  >
                    Reset
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <LeadFilters
                  filters={filters}
                  onChange={handleFiltersChange}
                  onReset={handleFiltersReset}
                />
              </CardContent>
            </Card>
          </motion.div>
          */}

          {/* Leads Grid */}
          <div>

            {/* Sort Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <div className="flex gap-2">
                  {(['newest', 'price', 'quality'] as const).map((option) => (
                    <Button
                      key={option}
                      variant={sortBy === option ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy(option)}
                      className={
                        sortBy === option
                          ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] text-white'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    >
                      {option === 'newest' && 'Newest'}
                      {option === 'price' && 'Price'}
                      {option === 'quality' && 'Quality'}
                    </Button>
                  ))}
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
              </Badge>
            </motion.div>

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
                  <ErrorState onRetry={fetchLeads} />
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && leads.length === 0 && (
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <EmptyState />
                </CardContent>
              </Card>
            )}

            {/* Leads Grid */}
            {!loading && !error && leads.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {leads.map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index % 6) }}
                  >
                    <LeadCard
                      lead={lead}
                      onViewDetails={handleViewDetails}
                      onPurchase={handlePurchase}
                      isPurchased={false}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {selectedLead && (
        <PurchaseConfirmationModal
          lead={selectedLead}
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setSelectedLead(null);
          }}
          onConfirm={handlePurchaseConfirm}
          loading={isPurchasing}
        />
      )}
    </div>
  );
}

