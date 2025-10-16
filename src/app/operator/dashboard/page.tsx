"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaBoxOpen as PackageIcon,
  FaCalendarAlt as CalendarIcon,
  FaUsers as UsersIcon,
  FaDollarSign as DollarSignIcon,
  FaArrowUp as TrendingUp,
  FaArrowDown as TrendingDown,
  FaPlus as Plus,
  FaChartBar as BarChart3Icon,
  FaRegCommentDots as MessageSquareIcon,
  FaDownload as DownloadIcon,
  FaCheckCircle as CheckCircleIcon,
  FaStar as StarIcon,
} from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { createClient } from '@/lib/supabase/client';

const OPERATOR_ROLES: UserRole[] = ['TOUR_OPERATOR', 'ADMIN', 'SUPER_ADMIN'];

type StatColor = 'blue' | 'green' | 'purple' | 'orange' | 'yellow' | 'red';

function StatCard({ icon: Icon, title, value, change, trend, color }: { icon: any; title: string; value: string; change: string; trend: 'up' | 'down'; color: StatColor }) {
  const colorMap: Record<StatColor, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const palette = colorMap[color] ?? colorMap.blue;
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${palette.bg}`}>
            <Icon className={`w-5 h-5 ${palette.text}`} />
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {change}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ icon: Icon, title, time, color }: { icon: any; title: string; time: string; color: StatColor }) {
  const colorMap: Record<StatColor, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const palette = colorMap[color] ?? colorMap.blue;
  return (
    <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-1.5 rounded-lg ${palette.bg} mt-0.5`}>
        <Icon className={`w-4 h-4 ${palette.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function OperatorDashboard() {
  const [stats, setStats] = useState<Array<{ icon: any; title: string; value: string; change: string; trend: 'up' | 'down'; color: StatColor }>>([
    { icon: PackageIcon, title: 'Total Packages', value: '0', change: '+0%', trend: 'up', color: 'blue' },
    { icon: CalendarIcon, title: 'Active Bookings', value: '0', change: '+0%', trend: 'up', color: 'green' },
    { icon: UsersIcon, title: 'Travel Agents', value: '0', change: '+0%', trend: 'up', color: 'purple' },
    { icon: DollarSignIcon, title: 'Monthly Revenue', value: '$0', change: '+0%', trend: 'up', color: 'orange' },
  ]);

  const [loading, setLoading] = useState(true);

  const activities: Array<{ icon: any; title: string; time: string; color: StatColor }> = [
    { icon: CheckCircleIcon, title: 'New booking confirmed', time: '2 minutes ago', color: 'green' },
    { icon: PackageIcon, title: 'Package "Bali Adventure" updated', time: '1 hour ago', color: 'blue' },
    { icon: StarIcon, title: 'New 5-star review received', time: '3 hours ago', color: 'yellow' },
    { icon: DollarSignIcon, title: 'Payment of $2,499 processed', time: '5 hours ago', color: 'green' },
    { icon: UsersIcon, title: 'New agent partnership request', time: '1 day ago', color: 'purple' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch operator-related metrics in parallel
        const [
          activityPackagesRes,
          multiCityPackagesRes,
          transferPackagesRes,
          travelAgentsRes,
        ] = await Promise.all([
          supabase.from('activity_packages').select('id, status, base_price').eq('operator_id', user.id),
          supabase.from('multi_city_packages').select('id, status, base_price').eq('operator_id', user.id),
          supabase.from('transfer_packages').select('id, status, base_price').eq('operator_id', user.id),
          supabase.from('users').select('id, role').eq('role', 'TRAVEL_AGENT'),
        ]);

        const allPackages = [
          ...(activityPackagesRes.data || []),
          ...(multiCityPackagesRes.data || []),
          ...(transferPackagesRes.data || []),
        ] as Array<{ id: string; status?: string; base_price?: number | null }>;

        const totalPackages = allPackages.length;
        const activePackages = allPackages.filter(p => p.status === 'published').length;
        const totalValue = allPackages.reduce((sum, p) => sum + (p.base_price || 0), 0);
        const travelAgentsCount = (travelAgentsRes.data || []).length;

        const fmt = (v: number | null | undefined) => {
          if (v === null || v === undefined) return '-';
          return Number.isFinite(v) ? v.toString() : '-';
        };
        const fmtCurrency = (v: number | null | undefined) => {
          if (!Number.isFinite(v || 0)) return '-';
          try {
            return `$${(v || 0).toFixed(0)}`;
          } catch {
            return '-';
          }
        };

        setStats([
          { icon: PackageIcon, title: 'Total Packages', value: fmt(totalPackages), change: '+0%', trend: 'up', color: 'blue' },
          { icon: CalendarIcon, title: 'Active Packages', value: fmt(activePackages), change: '+0%', trend: 'up', color: 'green' },
          { icon: UsersIcon, title: 'Travel Agents', value: fmt(travelAgentsCount), change: '+0%', trend: 'up', color: 'purple' },
          { icon: DollarSignIcon, title: 'Total Value', value: fmtCurrency(totalValue), change: '+0%', trend: 'up', color: 'orange' },
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] rounded-xl p-4 text-white shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, Tour Operator! 👋</h1>
          <p className="text-orange-100">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-700 text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/operator/packages/create" className="w-full">
              <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] hover:from-[#E05A2A] hover:to-[#E04080] text-white shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            </Link>
            <Link href="/operator/analytics" className="w-full">
              <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50 text-slate-700">
                <BarChart3Icon className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <Link href="/operator/communication" className="w-full">
              <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50 text-slate-700">
                <MessageSquareIcon className="w-4 h-4 mr-2" />
                Message Agents
              </Button>
            </Link>
            <Link href="/operator/reports" className="w-full">
              <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50 text-slate-700">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Link href="/operator/activity">
              <Button variant="ghost" size="sm" className="text-[#FF6B35] hover:text-[#E05A2A]">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-0">
            {activities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </CardContent>
        </Card>

        {/* Today's Overview */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Today&apos;s Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-[#FF6B35]" />
                <span className="text-sm font-medium text-gray-700">Bookings</span>
              </div>
              <span className="text-lg font-bold text-[#FF6B35]">12</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSignIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Revenue</span>
              </div>
              <span className="text-lg font-bold text-green-600">$3,240</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-5 h-5 text-[#FF4B8C]" />
                <span className="text-sm font-medium text-gray-700">New Agents</span>
              </div>
              <span className="text-lg font-bold text-[#FF4B8C]">3</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OperatorDashboardPage() {
  return (
    <ProtectedRoute requiredRoles={OPERATOR_ROLES}>
      <OperatorDashboard />
    </ProtectedRoute>
  );
}
