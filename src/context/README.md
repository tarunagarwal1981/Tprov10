# SupabaseAuthContext - Premium Authentication System

A comprehensive authentication context for Next.js applications with Supabase, featuring role-based access control, session management, and premium security features.

## 🚀 Features

### ✅ **Authentication State Management**
- User session from Supabase Auth
- User profile from database
- Loading states (initializing, authenticating, loading_profile)
- Error states with retry mechanism
- Role-based access control

### ✅ **Authentication Functions**
- `login(email, password)` - Email/password login
- `loginWithGoogle()` - Google OAuth
- `loginWithGithub()` - GitHub OAuth
- `register(userData)` - User registration with profile creation
- `logout()` - Sign out and clear session
- `resetPassword(email)` - Password reset
- `updatePassword(newPassword)` - Update password
- `updateProfile(data)` - Update user profile
- `uploadAvatar(file)` - Upload avatar to Supabase Storage

### ✅ **Session Management**
- Auto-refresh tokens
- Session persistence across tabs
- Session timeout handling
- Activity tracking
- Remember me functionality

### ✅ **Role-Based Features**
- `hasRole(role)` - Check user role
- `hasPermission(permission)` - Check specific permission
- `canAccessRoute(route)` - Check route access
- `getRedirectPath()` - Get redirect based on role

### ✅ **Error Handling**
- User-friendly error messages
- Retry logic for network errors
- Toast notifications for auth events
- Proper error logging

### ✅ **TypeScript Support**
- Proper type definitions
- Generic types for profile data
- Type-safe context consumer

### ✅ **Performance Optimization**
- Memoized values
- Optimized re-renders
- Lazy profile loading
- Efficient state updates

### ✅ **Cross-Platform Compatibility**
- Works on all browsers (Safari, Chrome, Firefox, Edge)
- Mobile web support (iOS Safari, Chrome Mobile)
- PWA support
- Offline detection

## 📁 Files Structure

```
src/context/
├── SupabaseAuthContext.tsx    # Main authentication context
├── auth-hooks.ts             # Additional utility hooks
├── auth-examples.tsx        # Usage examples
└── README.md                # This documentation
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js sonner
```

### 2. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup

Create the `users` table in your Supabase database:

```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'TRAVEL_AGENT',
  profile JSONB DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 4. Storage Setup

Create a storage bucket for avatars:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🎯 Usage

### 1. Provider Setup

Wrap your app with the `SupabaseAuthProvider`:

```tsx
import { SupabaseAuthProvider } from '@/context/SupabaseAuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseAuthProvider
          sessionTimeout={30}        // 30 minutes
          activityTimeout={15}      // 15 minutes
          enableRememberMe={true}
          enableActivityTracking={true}
        >
          {children}
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
```

### 2. Basic Authentication

```tsx
import { useAuth } from '@/context/SupabaseAuthContext';

export function LoginForm() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      // Redirect or show success message
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading === 'authenticating'}>
        {loading === 'authenticating' ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

### 3. Role-Based Access Control

```tsx
import { useRBAC } from '@/context/SupabaseAuthContext';

export function AdminPanel() {
  const { hasRole, hasPermission, userRole } = useRBAC();

  if (!hasRole('ADMIN') && !hasRole('SUPER_ADMIN')) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {userRole}</p>
      
      {hasPermission('manage_users') && (
        <button>Manage Users</button>
      )}
      
      {hasPermission('view_analytics') && (
        <button>View Analytics</button>
      )}
    </div>
  );
}
```

### 4. Route Protection

```tsx
import { ProtectedRoute } from '@/context/auth-examples';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute accessLevel="authenticated">
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute accessLevel="admin">
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

### 5. User Profile Management

```tsx
import { useUserProfile } from '@/context/auth-hooks';

export function ProfilePage() {
  const { user, profile, updateProfile, uploadAvatar } = useUserProfile();

  const handleUpdateProfile = async (data: any) => {
    const success = await updateProfile(data);
    if (success) {
      toast.success('Profile updated!');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const avatarUrl = await uploadAvatar(file);
    if (avatarUrl) {
      toast.success('Avatar updated!');
    }
  };

  return (
    <div>
      <h1>Profile</h1>
      <p>Name: {user?.name}</p>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAvatarUpload(file);
        }}
      />
    </div>
  );
}
```

## 🔧 Available Hooks

### Core Hooks

- `useAuth()` - Main authentication context
- `useRBAC()` - Role-based access control
- `useSession()` - Session management
- `useUserProfile()` - User profile management
- `useAuthActions()` - Authentication actions

### Utility Hooks

- `useIsAuthenticated()` - Check if user is authenticated
- `useAuthLoading()` - Get loading states
- `useAuthError()` - Get error states
- `useUserRole()` - Get user role information
- `useRouteProtection()` - Route protection utilities
- `useUserDisplay()` - User display information
- `useAuthStatus()` - Comprehensive auth status

## 🎨 User Roles & Permissions

### Roles

- `SUPER_ADMIN` - Full system access
- `ADMIN` - Administrative access
- `TOUR_OPERATOR` - Package management
- `TRAVEL_AGENT` - Booking management

### Permissions

- `create_packages` - Create travel packages
- `edit_packages` - Edit travel packages
- `delete_packages` - Delete travel packages
- `manage_users` - Manage user accounts
- `view_analytics` - View system analytics
- `manage_bookings` - Manage bookings
- `access_admin_panel` - Access admin panel
- `manage_operators` - Manage tour operators
- `manage_agents` - Manage travel agents

## 🔒 Security Features

### Session Management
- Automatic token refresh
- Session timeout handling
- Activity tracking
- Cross-tab synchronization
- Remember me functionality

### Error Handling
- User-friendly error messages
- Retry logic for network errors
- Proper error logging
- Toast notifications

### Access Control
- Role-based permissions
- Route protection
- Component-level access control
- API endpoint protection

## 📱 Cross-Platform Support

### Browser Support
- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)

### Features
- ✅ PWA support
- ✅ Offline detection
- ✅ Mobile web optimization
- ✅ Touch event handling

## 🚀 Performance Optimizations

### Memoization
- Context values are memoized
- Expensive calculations are cached
- Re-renders are minimized

### Lazy Loading
- Profile data is loaded on demand
- Components are loaded as needed
- Images are optimized

### State Management
- Efficient state updates
- Minimal re-renders
- Optimized subscriptions

## 🐛 Error Handling

### Error Types
- `network_error` - Network connectivity issues
- `invalid_credentials` - Wrong email/password
- `email_not_confirmed` - Email not verified
- `user_not_found` - User doesn't exist
- `email_already_exists` - Email already registered
- `weak_password` - Password too weak
- `session_expired` - Session has expired
- `permission_denied` - Insufficient permissions
- `profile_update_failed` - Profile update failed
- `avatar_upload_failed` - Avatar upload failed
- `unknown_error` - Unexpected error

### Retry Logic
- Automatic retry for network errors
- Maximum retry attempts (3)
- Exponential backoff
- User-friendly error messages

## 📊 Monitoring & Analytics

### Session Tracking
- User activity monitoring
- Session duration tracking
- Login/logout events
- Error rate monitoring

### Performance Metrics
- Authentication response times
- Profile loading times
- Error frequency
- User engagement metrics

## 🔧 Configuration Options

### Provider Props

```tsx
<SupabaseAuthProvider
  sessionTimeout={30}        // Session timeout in minutes
  activityTimeout={15}      // Activity timeout in minutes
  enableRememberMe={true}   // Enable remember me functionality
  enableActivityTracking={true} // Enable activity tracking
>
  {children}
</SupabaseAuthProvider>
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testing

### Unit Tests
- Authentication functions
- Role-based access control
- Error handling
- Session management

### Integration Tests
- End-to-end authentication flow
- Cross-tab synchronization
- Offline/online scenarios
- Error recovery

## 📚 Examples

See `src/context/auth-examples.tsx` for comprehensive usage examples including:

- Login/Registration forms
- User profile management
- Role-based access control
- Route protection
- Session management
- Error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:

1. Check the examples in `auth-examples.tsx`
2. Review the error handling section
3. Check the Supabase documentation
4. Open an issue on GitHub

---

**Built with ❤️ for the travel booking platform**
