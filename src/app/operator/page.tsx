'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp as TrendingUp, 
  FiTrendingDown as TrendingDown,
  FiPackage as Package, 
  FiDollarSign as DollarSign, 
  FiUsers as Users, 
  FiStar as Star,
  FiCalendar as Calendar,
  FiMessageSquare as MessageSquare,
  FiCheckCircle as CheckCircle,
  FiPlus as Plus,
  FiBarChart as BarChart3,
  FiDownload as Download,
  FiZap as Waves,
  FiMapPin as Mountain,
  FiNavigation as Plane
} from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/types';
import { useAuth } from '@/context/CognitoAuthContext';

const OPERATOR_ROLES: UserRole[] = ['TOUR_OPERATOR', 'ADMIN', 'SUPER_ADMIN'];

// Activity Item Component
const ActivityItem = ({ icon: Icon, title, time, color }: any) => (
  <div className="flex items-start gap-3 p-2 hover:bg-slate-50 transition-colors">
    <div className={`p-1.5 rounded-lg bg-${color}-100`}>
      <Icon className={`w-4 h-4 text-${color}-600`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{time}</p>
    </div>
  </div>
);

function OperatorDashboard() {
  const [stats, setStats] = useState([
    { title: 'Total Packages', value: '-', change: '+0%', trend: 'up', icon: Package, color: 'blue' },
    { title: 'Active Bookings', value: '-', change: '+0%', trend: 'up', icon: Calendar, color: 'green' },
    { title: 'Travel Agents', value: '-', change: '+0%', trend: 'up', icon: Users, color: 'purple' },
    { title: 'Monthly Revenue', value: '-', change: '+0%', trend: 'up', icon: DollarSign, color: 'orange' },
  ] as Array<{ title: string; value: string; change: string; trend: 'up' | 'down'; icon: any; color: string }>);
  const [overview, setOverview] = useState({ bookings: '-', revenue: '-', newAgents: '-' });

  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.id) return;

        // Fetch operator dashboard stats from AWS API
        const response = await fetch(`/api/operator/dashboard/stats?operatorId=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const { stats: dashboardStats } = await response.json();

        const fmt = (n: number | null | undefined) => (typeof n === 'number' && isFinite(n) ? n.toString() : '-');
        const fmtCurrency = (n: number | null | undefined) => (typeof n === 'number' && isFinite(n) ? `$${n.toFixed(0)}` : '-');

        setStats([
          { title: 'Total Packages', value: fmt(dashboardStats.totalPackages), change: '+0%', trend: 'up', icon: Package, color: 'blue' },
          { title: 'Active Bookings', value: '-', change: '+0%', trend: 'up', icon: Calendar, color: 'green' },
          { title: 'Travel Agents', value: fmt(dashboardStats.travelAgentsCount), change: '+0%', trend: 'up', icon: Users, color: 'purple' },
          { title: 'Monthly Revenue', value: fmtCurrency(dashboardStats.totalValue), change: '+0%', trend: 'up', icon: DollarSign, color: 'orange' },
        ]);

        setOverview({
          bookings: '-',
          revenue: fmtCurrency(dashboardStats.totalValue),
          newAgents: '-',
        });
      } catch (e) {
        // swallow; UI will show "-"
      }
    };
    load();
  }, [user?.id]);

  // Recent activities
  const recentActivities = [
    {
      icon: Calendar,
      title: 'New booking received',
      time: '2 minutes ago',
      color: 'green',
    },
    {
      icon: CheckCircle,
      title: 'Package "Mountain Adventure" published',
      time: '1 hour ago',
      color: 'blue',
    },
    {
      icon: MessageSquare,
      title: 'Customer review received',
      time: '3 hours ago',
      color: 'purple',
    },
    {
      icon: DollarSign,
      title: 'Payment processed',
      time: '5 hours ago',
      color: 'orange',
    },
    {
      icon: Users,
      title: 'New agent assigned',
      time: '1 day ago',
      color: 'indigo',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-pink-50/30">
      <div className="p-3 space-y-4">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] rounded-2xl p-4 text-white shadow-xl"
        >
          <h1 className="text-3xl font-bold mb-2">Welcome back, Tour Operator! 👋</h1>
          <p className="text-orange-100 text-lg">Here&apos;s what&apos;s happening with your business today.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-${stat.color}-100`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {stat.change}
            </div>
          </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                  <p className="text-sm text-slate-600">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-700 text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link href="/operator/packages/create">
                  <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] hover:from-[#E05A2A] hover:to-[#E04080] text-white shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Package
                </Button>
              </Link>
                <Link href="/operator/analytics">
                  <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50 text-slate-700">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Link href="/operator/communication">
                  <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50 text-slate-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Agents
                  </Button>
                </Link>
                <Link href="/operator/reports">
                  <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50 text-slate-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Recent Activity</CardTitle>
                <Link href="/operator/activity">
                  <Button variant="ghost" size="sm" className="text-[#FF6B35] hover:text-[#E05A2A]">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentActivities.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
          </div>
            </CardContent>
          </Card>
        </motion.div>

          {/* Today's Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="text-slate-900">Today&apos;s Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#FF6B35]" />
                    <span className="text-sm font-medium text-slate-700">Bookings</span>
                  </div>
                  <span className="text-lg font-bold text-[#FF6B35]">{overview.bookings}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">Revenue</span>
              </div>
                  <span className="text-lg font-bold text-green-600">{overview.revenue}</span>
            </div>
                <div className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#FF4B8C]" />
                    <span className="text-sm font-medium text-slate-700">New Agents</span>
              </div>
                  <span className="text-lg font-bold text-[#FF4B8C]">{overview.newAgents}</span>
            </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
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