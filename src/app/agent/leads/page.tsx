'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiShoppingBag,
  FiUser,
  FiDollarSign,
  FiStar,
  FiRefreshCw,
  FiPackage,
} from 'react-icons/fi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LeadPurchase } from '@/lib/types/marketplace';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PurchasedLeadsTable } from '@/components/agent/PurchasedLeadsTable';

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

  // Handle Create Proposal button click
  const handleCreateProposal = async (leadId: string) => {
    if (!user?.id) return;
    // Navigate directly to lead detail page
    router.push(`/agent/leads/${leadId}`);
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

        {/* Leads Table */}
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

            <Card>
              <CardContent className="p-0">
                <PurchasedLeadsTable 
                  purchases={purchases} 
                  loading={loading}
                  onCreateProposal={handleCreateProposal}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

    </div>
  );
}

