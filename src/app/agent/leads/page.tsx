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
  FiPlus,
} from 'react-icons/fi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { getAccessToken } from '@/lib/auth/getAccessToken';
import { LeadsManagementTable } from '@/components/agent/LeadsManagementTable';

interface LeadWithAggregates {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  destination: string;
  stage: string;
  priority: string;
  next_follow_up_date: string | null;
  last_contacted_at: string | null;
  created_at: string;
  itinerary_count: number;
  total_value: number;
  total_paid: number;
  last_communication_at: string | null;
  last_communication_type: string | null;
  assigned_to: string | null;
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
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Leads Yet</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        You don&apos;t have any leads yet. Create a new lead or browse the marketplace to find quality leads for your business.
      </p>
      <div className="flex gap-4">
        <Link href="/agent/leads/create">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
            <FiPlus className="w-4 h-4 mr-2" />
            Create Lead
          </Button>
        </Link>
        <Link href="/agent/marketplace">
          <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
            <FiShoppingBag className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function MyLeadsPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [leads, setLeads] = useState<LeadWithAggregates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllLeads = async () => {
    if (!user?.id) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const accessToken = getAccessToken();
      const response = await fetch('/api/leads/manage', {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch leads');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      toast.error('Failed to load your leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLeads();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  // Calculate stats
  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, lead) => sum + (lead.total_value || 0), 0);
  const totalPaid = leads.reduce((sum, lead) => sum + (lead.total_paid || 0), 0);
  const avgValue = totalLeads > 0 ? totalValue / totalLeads : 0;

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
              <h1 className="text-3xl font-bold mb-2">All Leads</h1>
              <p className="text-blue-100 text-lg">
                View and manage all your leads - purchased from marketplace and created by you
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/agent/leads/create">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <FiPlus className="w-5 h-5 mr-2" />
                  Create Lead
                </Button>
              </Link>
              <Button
                onClick={fetchAllLeads}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <FiRefreshCw className="w-5 h-5 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-blue-50">
                    <FiUser className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Leads</p>
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
                      ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Total Value</p>
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
                    <FiDollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Total Paid</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-orange-50">
                    <FiStar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${avgValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Avg Value</p>
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
                  onClick={fetchAllLeads}
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
        {!loading && !error && leads.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <EmptyState />
            </CardContent>
          </Card>
        )}

        {/* Leads Table */}
        {!loading && !error && leads.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                All Leads ({totalLeads})
              </h2>
              <div className="flex gap-2">
                <Link href="/agent/marketplace">
                  <Button 
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <FiShoppingBag className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
                <Link href="/agent/leads/create">
                  <Button 
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Create Lead
                  </Button>
                </Link>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <LeadsManagementTable 
                  leads={leads} 
                  loading={loading}
                  onRefresh={fetchAllLeads}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

