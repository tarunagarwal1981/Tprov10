'use client';

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiUsers,
  FiStar,
  FiPackage,
  FiMapPin,
  FiArrowRight,
} from 'react-icons/fi';
import { FaPlane, FaHiking, FaUmbrellaBeach, FaPaw, FaGem, FaMoneyBillWave, FaHeart } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/CognitoAuthContext';
import type { MarketplaceLead } from '@/lib/types/marketplace';
import { TripType } from '@/lib/types/marketplace';
import Link from 'next/link';

// Trip type icons
const getTripTypeIcon = (tripType: TripType) => {
  const icons = {
    [TripType.ADVENTURE]: FaHiking,
    [TripType.CULTURAL]: FaPlane,
    [TripType.BEACH]: FaUmbrellaBeach,
    [TripType.WILDLIFE]: FaPaw,
    [TripType.LUXURY]: FaGem,
    [TripType.BUDGET]: FaMoneyBillWave,
    [TripType.FAMILY]: FiUsers,
    [TripType.HONEYMOON]: FaHeart,
  };
  return icons[tripType] || FaPlane;
};

// Stat card component
function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  trend, 
  color 
}: { 
  icon: React.ElementType; 
  title: string; 
  value: string | number; 
  change?: string;
  trend?: 'up' | 'down';
  color: string;
}) {
  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-xl bg-${color}-50`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
          {change && trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingUp className="w-4 h-4 rotate-180" />}
              {change}
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
      </CardContent>
    </Card>
  );
}

// Featured lead card component
function FeaturedLeadCard({ lead, onBuyNow }: { lead: MarketplaceLead; onBuyNow: (id: string) => void }) {
  const TripIcon = getTripTypeIcon(lead.tripType);
  
  return (
    <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-2 rounded-lg">
              <TripIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 line-clamp-1">{lead.title}</h4>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <FiMapPin className="w-3 h-3" />
                <span className="line-clamp-1">{lead.destination}</span>
              </div>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shrink-0">
            <FiStar className="w-3 h-3 mr-1" />
            {lead.leadQualityScore}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <FiDollarSign className="w-3 h-3" />
            <span>${lead.budgetMin / 1000}k-${lead.budgetMax / 1000}k</span>
          </div>
          <div className="flex items-center gap-1">
            <FiCalendar className="w-3 h-3" />
            <span>{lead.durationDays}d</span>
          </div>
          <div className="flex items-center gap-1">
            <FiUsers className="w-3 h-3" />
            <span>{lead.travelersCount} pax</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div>
            <span className="text-lg font-bold text-blue-600">${lead.leadPrice}</span>
            <span className="text-xs text-gray-500 ml-1">lead price</span>
          </div>
          <Button
            size="sm"
            onClick={() => onBuyNow(lead.id)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgentDashboardPage() {
  const { user } = useAuth();
  
  // Component rendering
  
  // Stats state
  const [stats, setStats] = useState({
    availableLeads: 0,
    purchasedThisMonth: 0,
    totalSpent: 0,
    totalPurchases: 0,
  });

  // Featured leads state
  const [featuredLeads, setFeaturedLeads] = useState<MarketplaceLead[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  
  // State initialized

  // Fetch marketplace stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      
      try {
        // Fetching stats
        const response = await fetch(`/api/marketplace/stats?agentId=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const { stats: marketplaceStats } = await response.json();
        
        setStats({
          availableLeads: marketplaceStats.totalAvailable,
          purchasedThisMonth: marketplaceStats.thisMonth,
          totalSpent: marketplaceStats.totalSpent,
          totalPurchases: marketplaceStats.purchased,
        });
      } catch (error) {
        console.error('Error fetching marketplace stats:', error);
      } finally {
        // Stats fetch completed
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  // Fetch featured leads (top 3 by quality)
  useEffect(() => {
    const fetchFeaturedLeads = async () => {
      try {
        // Fetching featured leads
        const response = await fetch('/api/marketplace/featured?limit=3');
        if (!response.ok) throw new Error('Failed to fetch featured leads');
        const { leads } = await response.json();
        setFeaturedLeads(leads);
      } catch (error) {
        console.error('Error fetching featured leads:', error);
      } finally {
        // Featured leads fetch completed
        setLoadingLeads(false);
      }
    };

    fetchFeaturedLeads();
  }, []);

  const handleBuyNow = (leadId: string) => {
    // Navigate to marketplace with the specific lead
    window.location.href = `/agent/marketplace`;
  };

  // Rendering JSX
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <h1 className="text-3xl font-bold mb-2">Welcome back, Travel Agent! 👋</h1>
          <p className="text-blue-100 text-lg">
            Here&apos;s your business overview and latest opportunities
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              icon={FiShoppingBag}
              title="Available Leads"
              value={loadingStats ? '-' : stats.availableLeads}
              color="blue"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              icon={FiCalendar}
              title="Purchased This Month"
              value={loadingStats ? '-' : stats.purchasedThisMonth}
              change="+0%"
              trend="up"
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
              title="Lead Investment"
              value={loadingStats ? '-' : `$${stats.totalSpent.toLocaleString()}`}
              color="purple"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatCard
              icon={FiPackage}
              title="Total Purchased"
              value={loadingStats ? '-' : stats.totalPurchases}
              color="orange"
            />
          </motion.div>
        </div>

        {/* Featured Marketplace Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                    <FiStar className="w-5 h-5 text-white" />
                  </div>
                  Featured Marketplace Leads
                </CardTitle>
                <Link href="/agent/marketplace">
                  <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                    View All Leads
                    <FiArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Top quality leads available now in the marketplace
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {loadingLeads ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="border-gray-200 animate-pulse">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-16 bg-gray-200 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : featuredLeads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredLeads.map((lead) => (
                    <FeaturedLeadCard key={lead.id} lead={lead} onBuyNow={handleBuyNow} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FiPackage className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leads Available</h3>
                  <p className="text-gray-600 mb-4">Check back soon for new opportunities</p>
                  <Link href="/agent/marketplace">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                      Browse Marketplace
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-slate-700">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link href="/agent/marketplace" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                    <FiShoppingBag className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
                
                <Link href="/agent/leads" className="block">
                  <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50 text-slate-700">
                    <FiPackage className="w-4 h-4 mr-2" />
                    My Purchased Leads
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50 text-slate-700" disabled>
                  <FiCalendar className="w-4 h-4 mr-2" />
                  My Bookings
                  <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle>Recent Leads</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <FiPackage className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No recent leads yet</p>
                  <Link href="/agent/marketplace">
                    <Button variant="link" className="text-blue-600 mt-2">
                      Browse marketplace to get started
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiShoppingBag className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Available Leads</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{stats.availableLeads}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiPackage className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Total Purchases</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stats.totalPurchases}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiDollarSign className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Investment</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">${stats.totalSpent.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

