/**
 * Dashboard Layout Examples
 * Comprehensive examples showing different layout variants and features
 */

'use client';

import React, { useState } from 'react';
import { 
  DashboardLayout,
  DefaultLayout,
  CompactLayout,
  FullWidthLayout,
  CenteredLayout,
  AdminLayout,
  OperatorLayout,
  AgentLayout,
} from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Download, 
  Filter, 
  Search,
  Settings,
  Users,
  Package,
  Calendar,
  BarChart3,
  Star,
  TrendingUp,
  Activity,
} from 'lucide-react';

// ============================================================================
// EXAMPLE 1: DEFAULT LAYOUT WITH PAGE HEADER
// ============================================================================

export const DefaultLayoutExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <DefaultLayout
      title="Dashboard Overview"
      subtitle="Welcome back! Here's what's happening with your business today."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleRefresh}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      }
      loading={isLoading}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Revenue', value: '$45,231.89', change: '+20.1%', icon: TrendingUp, color: 'text-green-600' },
            { title: 'New Bookings', value: '+2,350', change: '+180.1%', icon: Calendar, color: 'text-blue-600' },
            { title: 'Active Packages', value: '12,234', change: '+19%', icon: Package, color: 'text-purple-600' },
            { title: 'Customer Rating', value: '4.8/5', change: '+0.2', icon: Star, color: 'text-yellow-600' },
          ].map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stat.value}
                </div>
                <p className={`text-xs ${stat.color} flex items-center mt-1`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart component would go here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Customer analytics chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
};

// ============================================================================
// EXAMPLE 2: COMPACT LAYOUT (COLLAPSED SIDEBAR)
// ============================================================================

export const CompactLayoutExample: React.FC = () => {
  return (
    <CompactLayout
      title="Quick Actions"
      subtitle="Streamlined interface for quick access to essential features."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Create Package', description: 'Add a new travel package', icon: Package, color: 'bg-blue-500' },
          { title: 'Manage Bookings', description: 'View and manage bookings', icon: Calendar, color: 'bg-green-500' },
          { title: 'View Analytics', description: 'Check performance metrics', icon: BarChart3, color: 'bg-purple-500' },
          { title: 'Customer Support', description: 'Help customers with issues', icon: Users, color: 'bg-orange-500' },
          { title: 'Settings', description: 'Configure your account', icon: Settings, color: 'bg-gray-500' },
          { title: 'Activity Feed', description: 'Recent activity and updates', icon: Activity, color: 'bg-indigo-500' },
        ].map((action, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {action.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </CompactLayout>
  );
};

// ============================================================================
// EXAMPLE 3: FULL WIDTH LAYOUT (NO SIDEBAR)
// ============================================================================

export const FullWidthLayoutExample: React.FC = () => {
  return (
    <FullWidthLayout
      title="Analytics Dashboard"
      subtitle="Comprehensive analytics and reporting for your business."
      showSidebar={false}
    >
      <div className="space-y-6">
        {/* Full-width charts */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Full-width revenue chart</p>
                <p className="text-sm">Perfect for detailed analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Mountain Adventure', bookings: 156, revenue: '$23,400' },
                  { name: 'Beach Paradise', bookings: 134, revenue: '$19,200' },
                  { name: 'City Explorer', bookings: 98, revenue: '$14,700' },
                  { name: 'Cultural Tour', bookings: 87, revenue: '$13,050' },
                ].map((package_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{package_.name}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{package_.bookings} bookings</p>
                    </div>
                    <Badge variant="secondary">{package_.revenue}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'New booking received', time: '2 minutes ago', type: 'booking' },
                  { action: 'Package published', time: '1 hour ago', type: 'package' },
                  { action: 'Review received', time: '3 hours ago', type: 'review' },
                  { action: 'Payment processed', time: '5 hours ago', type: 'payment' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {item.action}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FullWidthLayout>
  );
};

// ============================================================================
// EXAMPLE 4: CENTERED LAYOUT (FORMS)
// ============================================================================

export const CenteredLayoutExample: React.FC = () => {
  return (
    <CenteredLayout
      title="Create New Package"
      subtitle="Fill out the form below to create a new travel package."
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Package Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name</Label>
              <Input id="name" placeholder="Enter package name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" placeholder="Enter price" type="number" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Enter package description" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input id="duration" placeholder="Enter duration" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGroup">Max Group Size</Label>
              <Input id="maxGroup" placeholder="Enter max group size" type="number" />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Create Package</Button>
          </div>
        </CardContent>
      </Card>
    </CenteredLayout>
  );
};

// ============================================================================
// EXAMPLE 5: ROLE-BASED LAYOUTS
// ============================================================================

export const AdminLayoutExample: React.FC = () => {
  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="System administration and user management."
      requiredRole={['ADMIN', 'SUPER_ADMIN']}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Manage users, roles, and permissions
              </p>
              <Button className="w-full">Manage Users</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Configure system-wide settings
              </p>
              <Button className="w-full">System Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                View comprehensive analytics
              </p>
              <Button className="w-full">View Analytics</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export const OperatorLayoutExample: React.FC = () => {
  return (
    <OperatorLayout
      title="Tour Operator Dashboard"
      subtitle="Manage your packages and bookings."
      requiredRole={['TOUR_OPERATOR']}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Packages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Create and manage your travel packages
              </p>
              <Button className="w-full">Manage Packages</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                View and manage customer bookings
              </p>
              <Button className="w-full">View Bookings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </OperatorLayout>
  );
};

export const AgentLayoutExample: React.FC = () => {
  return (
    <AgentLayout
      title="Travel Agent Dashboard"
      subtitle="Help customers find and book their perfect trip."
      requiredRole={['TRAVEL_AGENT']}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Manage customer leads and inquiries
              </p>
              <Button className="w-full">Manage Leads</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Browse and recommend packages
              </p>
              <Button className="w-full">Browse Packages</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AgentLayout>
  );
};

// ============================================================================
// EXAMPLE 6: LOADING STATES
// ============================================================================

export const LoadingStatesExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <DefaultLayout
      title="Loading States Demo"
      subtitle="Demonstrating different loading states and transitions."
      loading={isLoading}
      actions={
        <Button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Loading...
            </>
          ) : (
            'Refresh Data'
          )}
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Loading</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-600 dark:text-zinc-400">
              This content will show skeleton loading when the refresh button is clicked.
              The loading state demonstrates smooth transitions and proper UX patterns.
            </p>
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DefaultLayoutExample,
  CompactLayoutExample,
  FullWidthLayoutExample,
  CenteredLayoutExample,
  AdminLayoutExample,
  OperatorLayoutExample,
  AgentLayoutExample,
  LoadingStatesExample,
};
