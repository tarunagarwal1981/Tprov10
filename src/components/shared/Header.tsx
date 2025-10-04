/**
 * Modern Header Component
 * Clean, minimal header with glassmorphism effect and premium features
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUserDisplay } from '@/context/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import {
  Search,
  Bell,
  User,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Home,
  Menu,
  X,
  Package,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SearchResult {
  id: string;
  type: 'package' | 'booking' | 'customer' | 'recent';
  title: string;
  subtitle?: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  thumbnail?: string;
  avatar?: string;
  badge?: string;
}

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'system' | 'promotion';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  href?: string;
}

interface HeaderProps {
  className?: string;
  onMenuToggle?: () => void;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'booking',
    title: 'New Booking Received',
    message: 'John Doe booked "Mountain Adventure Package"',
    time: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
    href: '/bookings/123',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Confirmed',
    message: 'Payment of $1,250 received for booking #BK-2024-001',
    time: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    read: false,
    href: '/bookings/123',
  },
  {
    id: '3',
    type: 'review',
    title: 'New Review',
    message: 'Sarah Wilson left a 5-star review for "Beach Paradise"',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
    href: '/reviews/456',
  },
  {
    id: '4',
    type: 'system',
    title: 'System Update',
    message: 'New features available in your dashboard',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    href: '/dashboard',
  },
];

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'package',
    title: 'Mountain Adventure Package',
    subtitle: '7 days • $1,250 per person',
    href: '/packages/mountain-adventure',
    icon: Package,
    thumbnail: '/images/mountain.jpg',
    badge: 'Popular',
  },
  {
    id: '2',
    type: 'booking',
    title: 'Booking #BK-2024-001',
    subtitle: 'John Doe • Mountain Adventure',
    href: '/bookings/bk-2024-001',
    icon: Calendar,
    badge: 'Confirmed',
  },
  {
    id: '3',
    type: 'customer',
    title: 'John Doe',
    subtitle: 'john.doe@email.com • 3 bookings',
    href: '/customers/john-doe',
    icon: Users,
    avatar: '/avatars/john.jpg',
  },
  {
    id: '4',
    type: 'recent',
    title: 'Beach Paradise Package',
    subtitle: 'Recently viewed',
    href: '/packages/beach-paradise',
    icon: Package,
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'booking':
      return Calendar;
    case 'payment':
      return CreditCard;
    case 'review':
      return Star;
    case 'system':
      return Info;
    case 'promotion':
      return AlertCircle;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'booking':
      return 'text-blue-600 dark:text-blue-400';
    case 'payment':
      return 'text-green-600 dark:text-green-400';
    case 'review':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'system':
      return 'text-purple-600 dark:text-purple-400';
    case 'promotion':
      return 'text-orange-600 dark:text-orange-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// ============================================================================
// BREADCRUMB COMPONENT
// ============================================================================

interface BreadcrumbProps {
  pathname: string;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ pathname, className }) => {
  const router = useRouter();
  
  const handleBreadcrumbClick = React.useCallback((href: string) => {
    router.push(href);
  }, [router]);
  
  const breadcrumbs = React.useMemo((): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/', icon: Home }
    ];
    
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Add icons for specific segments
      let icon;
      if (segment === 'dashboard') icon = Home;
      else if (segment === 'packages') icon = Package;
      else if (segment === 'bookings') icon = Calendar;
      else if (segment === 'customers') icon = Users;
      
      breadcrumbs.push({
        label,
        href: currentPath,
        icon,
      });
    });
    
    return breadcrumbs.slice(-3); // Max 3 levels
  }, [pathname]);
  
  return (
    <TooltipProvider>
      <nav className={cn('flex items-center space-x-1 text-sm', className)}>
        {breadcrumbs.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <React.Fragment key={`${item.href}-${index}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleBreadcrumbClick(item.href)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                      'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      isLast 
                        ? 'text-zinc-900 dark:text-zinc-100 font-medium' 
                        : 'text-zinc-600 dark:text-zinc-400'
                    )}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    <span className="truncate max-w-20">{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
              
              {!isLast && (
                <ChevronRight className="h-3 w-3 text-zinc-400" />
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </TooltipProvider>
  );
};

// ============================================================================
// SEARCH COMPONENT
// ============================================================================

interface SearchComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    if (query.length > 2) {
      setIsLoading(true);
      // Simulate search delay
      setTimeout(() => {
        const filtered = mockSearchResults.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
        setIsLoading(false);
      }, 300);
    } else {
      setResults([]);
    }
  }, [query]);
  
  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
    setQuery('');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <Command className="border-0">
          <CommandInput
            placeholder="Search packages, bookings, customers..."
            value={query}
            onValueChange={setQuery}
            className="h-12 text-base"
          />
          <CommandList className="max-h-96">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            )}
            
            {!isLoading && query.length > 2 && results.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            
            {!isLoading && results.length > 0 && (
              <>
                <CommandGroup heading="Results">
                  {results.map((result) => {
                    const Icon = result.icon;
                    return (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.href)}
                        className="flex items-center gap-3 p-3"
                      >
                        {result.avatar ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={result.avatar} />
                            <AvatarFallback>
                              {result.title.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ) : Icon ? (
                          <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>
                        ) : null}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        
                        {result.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {result.badge}
                          </Badge>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                
                <CommandGroup heading="Recent Searches">
                  {mockSearchResults
                    .filter(r => r.type === 'recent')
                    .slice(0, 3)
                    .map((result) => {
                      const Icon = result.icon;
                      return (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleSelect(result.href)}
                          className="flex items-center gap-3 p-3"
                        >
                          <Clock className="h-4 w-4 text-zinc-400" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                              {result.subtitle}
                            </p>
                          </div>
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// NOTIFICATIONS COMPONENT
// ============================================================================

interface NotificationsProps {
  notifications: Notification[];
  unreadCount: number;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, unreadCount }) => {
  const router = useRouter();
  
  const handleNotificationClick = (notification: Notification) => {
    if (notification.href) {
      router.push(notification.href);
    }
  };
  
  const handleMarkAllRead = () => {
    // Implement mark all as read
    console.log('Mark all as read');
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'flex items-start gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors',
                    !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                  )}
                >
                  <div className={cn('h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center', iconColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {formatTimeAgo(notification.time)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {notifications.length > 5 && (
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push('/notifications')}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================================================
// USER PROFILE COMPONENT
// ============================================================================

interface UserProfileProps {
  user: any;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const router = useRouter();
  const { displayName, displayAvatar, initials, userRole } = useUserDisplay();
  
  const handleProfileClick = () => {
    router.push('/profile');
  };
  
  const handleSettingsClick = () => {
    router.push('/settings');
  };
  
  const handleBillingClick = () => {
    router.push('/billing');
  };
  
  const handleHelpClick = () => {
    router.push('/help');
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={displayAvatar || undefined} />
            <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-zinc-900" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
        <DropdownMenuLabel className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={displayAvatar || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {displayName}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                {userRole}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          My Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Account Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleBillingClick} className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleHelpClick} className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          Help Center
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onLogout} 
          className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================================================
// MAIN HEADER COMPONENT
// ============================================================================

export const Header: React.FC<HeaderProps> = ({ className, onMenuToggle }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications] = useState<Notification[]>(mockNotifications);
  const [unreadCount] = useState(2); // Mock unread count
  
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <>
      <motion.header
        className={cn(
          'sticky top-0 z-40 w-full',
          'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl',
          'border-b border-zinc-200/50 dark:border-zinc-800/50',
          'transition-shadow duration-200',
          isScrolled && 'shadow-sm shadow-zinc-200/20 dark:shadow-zinc-900/20',
          className
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex h-16 items-center justify-between px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="lg:hidden h-9 w-9 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Breadcrumbs - Desktop Only - Temporarily disabled */}
            <div className="hidden lg:block">
              {/* <Breadcrumb pathname={pathname} /> */}
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {pathname === '/' ? 'Home' : pathname.split('/').pop()?.charAt(0).toUpperCase() + pathname.split('/').pop()?.slice(1)}
              </div>
            </div>
          </div>
          
          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setIsSearchOpen(true)}
                className="w-full justify-start text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 h-9 px-3"
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Search packages, bookings, customers...</span>
                <span className="sm:hidden">Search...</span>
                <kbd className="ml-auto hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-zinc-100 px-1.5 font-mono text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Notifications 
              notifications={notifications} 
              unreadCount={unreadCount} 
            />
            
            {/* User Profile */}
            {user && (
              <UserProfile 
                user={user} 
                onLogout={handleLogout} 
              />
            )}
          </div>
        </div>
      </motion.header>
      
      {/* Search Modal */}
      <SearchComponent 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
};

export default Header;

