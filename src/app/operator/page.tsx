'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Package, 
  DollarSign, 
  Users, 
  Star,
  Calendar,
  MessageSquare,
  CheckCircle,
  Plus,
  BarChart3,
  Download,
  Waves,
  Mountain,
  Plane
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const OPERATOR_ROLES = ['TOUR_OPERATOR', 'ADMIN', 'SUPER_ADMIN'];

// Activity Item Component
const ActivityItem = ({ icon: Icon, title, time, color }: any) => (
  <div className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
    <div className={`p-2 rounded-lg bg-${color}-100`}>
      <Icon className={`w-4 h-4 text-${color}-600`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{time}</p>
    </div>
  </div>
);

function OperatorDashboard() {
  // Stats data
  const stats = [
    {
      title: 'Total Packages',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: Package,
      color: 'blue',
    },
    {
      title: 'Active Bookings',
      value: '156',
      change: '+8%',
      trend: 'up',
      icon: Calendar,
      color: 'green',
    },
    {
      title: 'Travel Agents',
      value: '42',
      change: '+5%',
      trend: 'up',
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Monthly Revenue',
      value: '$24,580',
      change: '+15%',
      trend: 'up',
      icon: DollarSign,
      color: 'orange',
    },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl"
        >
          <h1 className="text-3xl font-bold mb-2">Welcome back, Tour Operator! 👋</h1>
          <p className="text-blue-100 text-lg">Here's what's happening with your business today.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
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
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/operator/packages/create">
                  <Button className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Package
                </Button>
              </Link>
                <Link href="/operator/analytics">
                  <Button className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Link href="/operator/communication">
                  <Button className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Agents
                  </Button>
                </Link>
                <Link href="/operator/reports">
                  <Button className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity & Performance */}
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

          {/* Today's Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="text-slate-900">Today's Overview</CardTitle>
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