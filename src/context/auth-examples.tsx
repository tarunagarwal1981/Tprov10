/**
 * SupabaseAuthContext Usage Examples
 * Comprehensive examples showing how to use the authentication context
 */

'use client';

import React, { useEffect, useState } from 'react';
import { 
  SupabaseAuthProvider, 
  useAuth, 
  useRBAC, 
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useUserProfile,
  useAuthActions,
  useRouteProtection,
  useUserDisplay,
  useAuthStatus,
} from './SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// ============================================================================
// EXAMPLE 1: BASIC AUTHENTICATION COMPONENT
// ============================================================================

export const LoginForm: React.FC = () => {
  const { login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const success = await login(email, password, rememberMe);
    if (success) {
      toast.success('Welcome back!');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember">Remember me</label>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">
              {error.message}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading === 'authenticating'}
          >
            {loading === 'authenticating' ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXAMPLE 2: REGISTRATION COMPONENT
// ============================================================================

export const RegistrationForm: React.FC = () => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'TRAVEL_AGENT' as const,
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    const success = await register({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      profile: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        currency: 'USD',
        notification_preferences: {
          email: true,
          sms: false,
          push: true,
          marketing: false,
        },
      },
    });
    
    if (success) {
      toast.success('Account created successfully!');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            type="tel"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          
          {error && (
            <div className="text-red-500 text-sm">
              {error.message}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading === 'authenticating'}
          >
            {loading === 'authenticating' ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXAMPLE 3: USER PROFILE COMPONENT
// ============================================================================

export const UserProfile: React.FC = () => {
  const { user, profile, updateProfile, uploadAvatar, loading } = useUserProfile();
  const { displayName, displayEmail, displayAvatar, initials } = useUserDisplay();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await updateProfile({
      name: editData.name,
      phone: editData.phone,
    });
    
    if (success) {
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const avatarUrl = await uploadAvatar(file);
    if (avatarUrl) {
      toast.success('Avatar updated successfully!');
    }
  };

  if (!user) {
    return <div>Please sign in to view your profile.</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={displayAvatar || undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{displayName}</h3>
            <p className="text-gray-600">{displayEmail}</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="mt-2"
              disabled={loading === 'uploading_avatar'}
            />
            {loading === 'uploading_avatar' && (
              <p className="text-sm text-gray-500">Uploading avatar...</p>
            )}
          </div>
        </div>

        {/* Profile Information */}
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              type="text"
              placeholder="Full Name"
              value={editData.name}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              type="tel"
              placeholder="Phone"
              value={editData.phone}
              onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
            />
            <div className="flex space-x-2">
              <Button type="submit" disabled={loading === 'updating_profile'}>
                {loading === 'updating_profile' ? 'Updating...' : 'Save Changes'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-lg">{user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <p className="text-lg">{user.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXAMPLE 4: ROLE-BASED ACCESS CONTROL
// ============================================================================

export const AdminPanel: React.FC = () => {
  const { hasRole, hasPermission, userRole, permissions } = useRBAC();
  const { isAdmin, isOperator, isAgent } = useUserRole();

  if (!hasRole('ADMIN') && !hasRole('SUPER_ADMIN')) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <div className="flex space-x-2">
          <Badge variant="outline">Role: {userRole}</Badge>
          {isAdmin && <Badge variant="destructive">Admin</Badge>}
          {isOperator && <Badge variant="secondary">Operator</Badge>}
          {isAgent && <Badge variant="default">Agent</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Permissions</h3>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <Badge key={permission} variant="outline">
                {permission.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasPermission('manage_users') && (
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Manage users, roles, and permissions</p>
                <Button className="mt-2">Manage Users</Button>
              </CardContent>
            </Card>
          )}

          {hasPermission('view_analytics') && (
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>View system analytics and reports</p>
                <Button className="mt-2">View Analytics</Button>
              </CardContent>
            </Card>
          )}

          {hasPermission('create_packages') && (
            <Card>
              <CardHeader>
                <CardTitle>Package Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Create and manage travel packages</p>
                <Button className="mt-2">Manage Packages</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXAMPLE 5: SESSION MANAGEMENT
// ============================================================================

export const SessionInfo: React.FC = () => {
  const { session, sessionActivity, isOnline, trackActivity } = useSession();
  const { isIdle, lastActivity } = useActivityTracker();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Session Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Session Status</label>
          <p className="text-lg">
            {session ? 'Active' : 'No Session'}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Connection</label>
          <p className="text-lg">
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Activity Status</label>
          <p className="text-lg">
            <Badge variant={isIdle ? 'secondary' : 'default'}>
              {isIdle ? 'Idle' : 'Active'}
            </Badge>
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Last Activity</label>
          <p className="text-sm text-gray-600">
            {lastActivity.toLocaleTimeString()}
          </p>
        </div>
        
        <Button onClick={trackActivity} variant="outline">
          Track Activity
        </Button>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXAMPLE 6: ROUTE PROTECTION COMPONENT
// ============================================================================

export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  accessLevel: 'public' | 'authenticated' | 'admin' | 'operator' | 'agent';
  fallback?: React.ReactNode;
}> = ({ children, accessLevel, fallback }) => {
  const { protectRoute, canAccess } = useRouteProtection();
  const { isAuthenticated } = useIsAuthenticated();
  const { isInitialized } = useAuthLoading();

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  const redirectPath = protectRoute(window.location.pathname, accessLevel);
  
  if (redirectPath) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Redirect to login or appropriate page
    window.location.href = redirectPath;
    return null;
  }

  return <>{children}</>;
};

// ============================================================================
// EXAMPLE 7: AUTHENTICATION STATUS COMPONENT
// ============================================================================

export const AuthStatus: React.FC = () => {
  const { isAuthenticated, isLoading, isInitialized, hasError, error } = useAuthStatus();
  const { user, userRole } = useAuth();
  const { displayName, displayAvatar, initials } = useUserDisplay();

  if (!isInitialized) {
    return <div>Initializing authentication...</div>;
  }

  if (hasError) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600">Authentication Error</h2>
        <p className="text-gray-600">{error?.message}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Welcome</h2>
        <p className="text-gray-600">Please sign in to continue</p>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Avatar>
        <AvatarImage src={displayAvatar || undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold">{displayName}</p>
        <p className="text-sm text-gray-600">{userRole}</p>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 8: MAIN APP COMPONENT WITH PROVIDER
// ============================================================================

export const AppWithAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SupabaseAuthProvider
      sessionTimeout={30}
      activityTimeout={15}
      enableRememberMe={true}
      enableActivityTracking={true}
    >
      {children}
    </SupabaseAuthProvider>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  LoginForm,
  RegistrationForm,
  UserProfile,
  AdminPanel,
  SessionInfo,
  ProtectedRoute,
  AuthStatus,
  AppWithAuth,
};

