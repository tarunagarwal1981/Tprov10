'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from './DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FiPlus, 
  FiDownload, 
  FiFilter, 
  FiSearch,
  FiSettings,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiBarChart,
  FiStar,
  FiTrendingUp,
  FiActivity,
  FiDollarSign,
  FiCreditCard,
  FiAlertCircle,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';

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
    <DashboardLayout
      title="Dashboard Overview"
      subtitle="Welcome back! Here&apos;s what&apos;s happening with your business today."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FiDownload className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleRefresh}>
            <FiPlus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <FiDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <FiUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2350</div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <FiCreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12,234</div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <FiActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground">
                +201 since last hour
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiBarChart className="h-5 w-5" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FiBarChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart component would go here</p>
                  <p className="text-sm">Integration with recharts or similar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiUsers className="h-5 w-5" />
                Customer Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FiUsers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Customer analytics chart</p>
                  <p className="text-sm">User engagement metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiActivity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New booking received</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
                <Badge variant="secondary">New</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment processed</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
                <Badge variant="outline">Success</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Customer review received</p>
                  <p className="text-xs text-muted-foreground">10 minutes ago</p>
                </div>
                <Badge variant="outline">Review</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// ============================================================================
// EXAMPLE 2: COMPACT LAYOUT
// ============================================================================

export const CompactLayoutExample: React.FC = () => {
  return (
    <DashboardLayout
      variant="compact"
      title="Quick Stats"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Bookings</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <FiCalendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Revenue</p>
                <p className="text-2xl font-bold">$45,231</p>
              </div>
              <FiDollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Customers</p>
                <p className="text-2xl font-bold">567</p>
              </div>
              <FiUsers className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// ============================================================================
// EXAMPLE 3: FULLWIDTH LAYOUT
// ============================================================================

export const FullwidthLayoutExample: React.FC = () => {
  return (
    <DashboardLayout
      variant="fullwidth"
      title="Analytics Dashboard"
      subtitle="Comprehensive view of your business metrics"
    >
      <div className="space-y-6">
        {/* Full-width chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FiBarChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Full-width chart component</p>
                <p className="text-sm">Perfect for detailed analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data table placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <FiCreditCard className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Transaction #{i}</p>
                      <p className="text-sm text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">+$1,234</p>
                    <Badge variant="outline">Completed</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// ============================================================================
// EXAMPLE 4: CENTERED LAYOUT
// ============================================================================

export const CenteredLayoutExample: React.FC = () => {
  return (
    <DashboardLayout
      variant="centered"
      title="Welcome to TravelPro"
      subtitle="Get started with your first package"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Quick Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FiPackage className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Create your first package</p>
                <p className="text-sm text-muted-foreground">Add tours and experiences</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <FiCalendar className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Set up booking calendar</p>
                <p className="text-sm text-muted-foreground">Manage availability</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <FiUsers className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Invite your team</p>
                <p className="text-sm text-muted-foreground">Collaborate with colleagues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" className="w-full">
            <FiPlus className="h-4 w-4 mr-2" />
            Get Started
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

// ============================================================================
// EXAMPLE 5: LAYOUT WITH CUSTOM ACTIONS
// ============================================================================

export const CustomActionsLayoutExample: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DashboardLayout
      title="Package Management"
      subtitle="Manage your travel packages and bookings"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <FiFilter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <FiPlus className="h-4 w-4 mr-2" />
            New Package
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FiPackage className="h-16 w-16 text-white opacity-80" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Package #{i}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Amazing travel experience with great value
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <FiStar className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

// ============================================================================
// EXAMPLE 6: LAYOUT WITH LOADING STATES
// ============================================================================

export const LoadingStatesLayoutExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout
      title="Loading Example"
      subtitle="Demonstrating loading states"
      loading={isLoading}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content will appear here</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This content is shown after the loading state completes.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// ============================================================================
// EXAMPLE 7: LAYOUT WITH ERROR STATES
// ============================================================================

export const ErrorStatesLayoutExample: React.FC = () => {
  const [hasError, setHasError] = useState(false);

  const triggerError = () => setHasError(true);
  const retry = () => setHasError(false);

  if (hasError) {
    return (
      <DashboardLayout
        title="Error Example"
        subtitle="Demonstrating error handling"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <FiAlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-muted-foreground mb-6">
                We encountered an error while loading your data.
              </p>
              <Button onClick={retry}>
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Error Example"
      subtitle="Demonstrating error handling"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Normal Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is normal content. Click the button below to trigger an error state.</p>
            <Button onClick={triggerError} variant="destructive" className="mt-4">
              <FiX className="h-4 w-4 mr-2" />
              Trigger Error
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const LayoutExamples: React.FC = () => {
  const [activeExample, setActiveExample] = useState('default');

  const examples = [
    { id: 'default', name: 'Default Layout', component: DefaultLayoutExample },
    { id: 'compact', name: 'Compact Layout', component: CompactLayoutExample },
    { id: 'fullwidth', name: 'Fullwidth Layout', component: FullwidthLayoutExample },
    { id: 'centered', name: 'Centered Layout', component: CenteredLayoutExample },
    { id: 'custom-actions', name: 'Custom Actions', component: CustomActionsLayoutExample },
    { id: 'loading', name: 'Loading States', component: LoadingStatesLayoutExample },
    { id: 'error', name: 'Error States', component: ErrorStatesLayoutExample },
  ];

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || DefaultLayoutExample;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Layout Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <Button
                key={example.id}
                variant={activeExample === example.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveExample(example.id)}
              >
                {example.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg overflow-hidden">
        <ActiveComponent />
      </div>
    </div>
  );
};