'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiShoppingBag,
  FiDollarSign,
  FiStar,
} from 'react-icons/fi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';
import { LeadsManagementTable } from '@/components/agent/LeadsManagementTable';
import Link from 'next/link';

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

export default function NewLeadsManagementPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [leads, setLeads] = useState<LeadWithAggregates[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchLeads = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/leads/purchased?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch purchased leads');
      }
    } catch (error) {
      console.error('Error fetching purchased leads:', error);
      toast.error('Failed to fetch purchased leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filters, user?.id]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  // Calculate stats from leads data
  const totalPurchased = leads.length;
  const totalSpent = leads.reduce((sum, lead) => {
    // Note: purchase price is not in LeadWithAggregates, so we'll use total_value as approximation
    // or fetch from a separate query if needed. For now, we'll show total value of itineraries.
    return sum + (lead.total_value || 0);
  }, 0);
  // Avg quality score would need to be fetched separately or added to the API response
  const avgQualityScore = 0; // Placeholder - can be enhanced later


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Leads Management</h1>
        <p className="text-gray-600">Manage your purchased leads, communications, and payments in one place</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  <p className="text-2xl font-bold text-gray-900">{pagination.total || totalPurchased}</p>
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
                    ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <FiStar className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {leads.reduce((sum, lead) => sum + lead.itinerary_count, 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Itineraries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, destination..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="WON">Won</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="value">Total Value</SelectItem>
                  <SelectItem value="last_communication">Last Communication</SelectItem>
                  <SelectItem value="follow_up">Follow-up Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={fetchLeads}
              className="flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </Button>
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <LeadsManagementTable
            leads={leads}
            loading={loading}
            onRefresh={fetchLeads}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', filters.page - 1)}
              disabled={filters.page === 1}
            >
              <FiChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {filters.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', filters.page + 1)}
              disabled={filters.page >= pagination.totalPages}
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

