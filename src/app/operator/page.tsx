'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBox as Package, 
  FaCalendarAlt as Calendar, 
  FaUsers as Users, 
  FaChartLine as TrendingUp, 
  FaDollarSign as DollarSign,
  FaStar as Star,
  FaPlus as Plus,
  FaChartBar as BarChart3,
  FaComments as MessageSquare,
  FaDownload as Download,
  FaArrowUp as ArrowUpRight,
  FaArrowDown as ArrowDownRight,
  FaClock as Clock,
  FaCheckCircle as CheckCircle,
  FaExclamationCircle as AlertCircle
} from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { useAuth } from '@/context/SupabaseAuthContext';
import Link from 'next/link';
import '@/styles/cross-browser.css';

// Stats Card Component with Premium Design
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  loading?: boolean;
}

function StatsCard({ title, value, change, changeLabel, icon: Icon, color, loading }: StatsCardProps) {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200'
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200'
    }
  };

  const colors = colorClasses[color];
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glassmorphism-card chrome-border-fix ios-shadow-fix hover-lift chrome-animation-fix h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">
                {loading ? '...' : value}
              </p>
              {change !== undefined && (
                <div className="flex items-center gap-1 text-sm">
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : isNegative ? (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  ) : null}
                  <span className={isPositive ? 'text-green-600 font-semibold' : isNegative ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                    {Math.abs(change)}%
                  </span>
                  {changeLabel && (
                    <span className="text-slate-500 ml-1">{changeLabel}</span>
                  )}
                </div>
              )}
            </div>
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Activity Item Component
interface ActivityItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
  type: 'booking' | 'package' | 'agent' | 'payment';
}

function ActivityItem({ icon: Icon, title, description, time, type }: ActivityItemProps) {
  const typeColors = {
    booking: 'bg-blue-50 text-blue-600',
    package: 'bg-purple-50 text-purple-600',
    agent: 'bg-green-50 text-green-600',
    payment: 'bg-orange-50 text-orange-600'
  };

    return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
    >
      <div className={`w-10 h-10 rounded-full ${typeColors[type]} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600 truncate">{description}</p>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {time}
        </p>
      </div>
    </motion.div>
  );
}

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalPackages: 24,
    activeBookings: 156,
    partnerAgents: 42,
    monthlyRevenue: 24580,
    averageRating: 4.8,
    conversionRate: 68
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Simulate loading - replace with real Supabase query
    const fetchDashboardData = async () => {
      try {
        // TODO: Fetch from Supabase
        // const { data } = await dashboardService.getOperatorStats();
        // setStats(data);
        setTimeout(() => setLoading(false), 1000);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [mounted]); // Run only after component is mounted

  const recentActivities = [
    {
      icon: CheckCircle,
      title: 'New Booking Confirmed',
      description: 'Dubai Adventure Package - Sarah Johnson',
      time: '5 minutes ago',
      type: 'booking' as const
    },
    {
      icon: Package,
      title: 'Package Published',
      description: 'Maldives Luxury Escape is now live',
      time: '1 hour ago',
      type: 'package' as const
    },
    {
      icon: Users,
      title: 'New Agent Partnership',
      description: 'Global Travel Co. joined your network',
      time: '2 hours ago',
      type: 'agent' as const
    },
    {
      icon: DollarSign,
      title: 'Payment Received',
      description: '£2,499 from Tokyo Tour booking',
      time: '3 hours ago',
      type: 'payment' as const
    },
    {
      icon: Star,
      title: 'New 5-Star Review',
      description: 'Amazing experience! - Michael Chen',
      time: '5 hours ago',
      type: 'booking' as const
    }
  ];

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
  return (
      <DashboardLayout
        title="Loading..."
        subtitle="Please wait while we load your dashboard"
        requiredRole={['TOUR_OPERATOR']}
      >
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
            ))}
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 rounded-lg"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.name || 'Operator'}! 👋`}
      subtitle="Here's what's happening with your business today"
      requiredRole={['TOUR_OPERATOR']}
    >
      <div className="space-y-8 ios-viewport-fix chrome-layout-fix">

      {/* Stats Grid */}
      <div className="dashboard-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Packages"
          value={stats.totalPackages}
          change={12}
          changeLabel="vs last month"
          icon={Package}
          color="blue"
          loading={loading}
        />
        <StatsCard
          title="Active Bookings"
          value={stats.activeBookings}
          change={8}
          changeLabel="vs last month"
          icon={Calendar}
          color="green"
          loading={loading}
        />
        <StatsCard
          title="Partner Agents"
          value={stats.partnerAgents}
          change={5}
          changeLabel="vs last month"
          icon={Users}
          color="purple"
          loading={loading}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`£${stats.monthlyRevenue.toLocaleString()}`}
          change={15}
          changeLabel="vs last month"
          icon={DollarSign}
          color="orange"
          loading={loading}
        />
        <StatsCard
          title="Average Rating"
          value={stats.averageRating}
          change={2}
          changeLabel="vs last month"
          icon={Star}
          color="indigo"
          loading={loading}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          change={-3}
          changeLabel="vs last month"
          icon={TrendingUp}
          color="red"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="gradient-bg border-0 ios-shadow-fix chrome-animation-fix text-white">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/operator/packages/create">
                <Button 
                  size="lg"
                  className="w-full bg-white text-blue-600 hover:bg-slate-100 font-semibold h-14 ios-shadow-fix chrome-animation-fix ios-button-fix chrome-font-fix group"
                >
                  <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                  Create New Package
                </Button>
              </Link>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link href="/operator/analytics">
                  <Button 
                    variant="secondary"
                    className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/operator/communication">
                  <Button 
                    variant="secondary"
                    className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Messages
                  </Button>
                </Link>
                <Link href="/operator/bookings">
                  <Button 
                    variant="secondary"
                    className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Summary - 1 column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg h-full">
            <CardHeader>
              <CardTitle className="text-slate-900">Today&apos;s Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Bookings</span>
                </div>
                <span className="text-lg font-bold text-blue-600">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-slate-700">Revenue</span>
                </div>
                <span className="text-lg font-bold text-green-600">£3,240</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">New Agents</span>
                </div>
                <span className="text-lg font-bold text-purple-600">3</span>
              </div>
            </CardContent>
          </Card>
            </motion.div>
        </div>

      {/* Recent Activity & Top Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Button variant="ghost" size="sm" className="text-blue-600">
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

        {/* Top Performing Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Top Packages</CardTitle>
                <Link href="/operator/packages">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { name: 'Dubai Adventure', bookings: 45, revenue: '£12,450', rating: 4.9 },
                { name: 'Maldives Luxury', bookings: 32, revenue: '£18,200', rating: 5.0 },
                { name: 'Tokyo Explorer', bookings: 28, revenue: '£8,960', rating: 4.8 },
              ].map((pkg, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-transparent rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {pkg.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {pkg.bookings} bookings &middot; {pkg.revenue}
                    </p>
            </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold text-slate-900">{pkg.rating}</span>
              </div>
            </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
    </DashboardLayout>
  );
}