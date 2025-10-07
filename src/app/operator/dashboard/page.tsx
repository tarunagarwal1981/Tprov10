"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Package as PackageIcon,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  DollarSign as DollarSignIcon,
  TrendingUp,
  TrendingDown,
  Plus,
  BarChart3 as BarChart3Icon,
  MessageSquare as MessageSquareIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const OPERATOR_ROLES = ['TOUR_OPERATOR', 'ADMIN', 'SUPER_ADMIN'];

function StatCard({ icon: Icon, title, value, change, trend, color }: any) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const palette = colorMap[color] || colorMap.blue;
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${palette.bg}`}>
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

function ActivityItem({ icon: Icon, title, time, color }: any) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const palette = colorMap[color] || colorMap.blue;
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${palette.bg} mt-0.5`}>
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
  const stats = [
    { icon: PackageIcon, title: 'Total Packages', value: '24', change: '+12%', trend: 'up', color: 'blue' },
    { icon: CalendarIcon, title: 'Active Bookings', value: '156', change: '+8%', trend: 'up', color: 'green' },
    { icon: UsersIcon, title: 'Travel Agents', value: '42', change: '+5%', trend: 'up', color: 'purple' },
    { icon: DollarSignIcon, title: 'Monthly Revenue', value: '$24,580', change: '+15%', trend: 'up', color: 'orange' },
  ];

  const activities = [
    { icon: CheckCircleIcon, title: 'New booking confirmed', time: '2 minutes ago', color: 'green' },
    { icon: PackageIcon, title: 'Package "Bali Adventure" updated', time: '1 hour ago', color: 'blue' },
    { icon: StarIcon, title: 'New 5-star review received', time: '3 hours ago', color: 'yellow' },
    { icon: DollarSignIcon, title: 'Payment of $2,499 processed', time: '5 hours ago', color: 'green' },
    { icon: UsersIcon, title: 'New agent partnership request', time: '1 day ago', color: 'purple' },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, Tour Operator! 👋</h1>
          <p className="text-blue-100">Here's what's happening with your business today.</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/operator/packages/create" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            </Link>
            <Link href="/operator/analytics" className="w-full">
              <Button variant="outline" className="w-full">
                <BarChart3Icon className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <Link href="/operator/communication" className="w-full">
              <Button variant="outline" className="w-full">
                <MessageSquareIcon className="w-4 h-4 mr-2" />
                Message Agents
              </Button>
            </Link>
            <Link href="/operator/reports" className="w-full">
              <Button variant="outline" className="w-full">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Link href="/operator/activity">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {activities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </CardContent>
        </Card>

        {/* Today's Overview */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Today's Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Bookings</span>
              </div>
              <span className="text-lg font-bold text-blue-600">12</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSignIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Revenue</span>
              </div>
              <span className="text-lg font-bold text-green-600">$3,240</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">New Agents</span>
              </div>
              <span className="text-lg font-bold text-purple-600">3</span>
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
