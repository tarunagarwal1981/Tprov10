'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUserDisplay } from '@/context/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import {
  FiSearch,
  FiBell,
  FiUser,
  FiSettings,
  FiCreditCard,
  FiHelpCircle,
  FiLogOut,
  FiChevronRight,
  FiHome,
  FiMenu,
  FiX,
  FiPackage,
  FiCalendar,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiStar,
} from 'react-icons/fi';
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
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  thumbnail?: string;
  badge?: string;
}

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NotificationItem {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'system' | 'marketing';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  href?: string;
}

interface HeaderProps {
  className?: string;
  variant?: 'default' | 'compact' | 'transparent';
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showBreadcrumbs?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

// ============================================================================
// DATA AND CONSTANTS
// ============================================================================

const searchResults: SearchResult[] = [
  {
    id: '1',
    title: 'Mountain Adventure Package',
    subtitle: '7 days • $1,250 per person',
    href: '/packages/mountain-adventure',
    icon: FiPackage,
    thumbnail: '/images/mountain.jpg',
    badge: 'Popular',
  },
  {
    id: '2',
    title: 'City Tour Booking',
    subtitle: 'Paris • Tomorrow 2:00 PM',
    href: '/bookings/city-tour',
    icon: FiCalendar,
    thumbnail: '/images/paris.jpg',
    badge: 'Confirmed',
  },
  {
    id: '3',
    title: 'Customer Support',
    subtitle: 'Help center and documentation',
    href: '/support',
    icon: FiHelpCircle,
  },
];

const notifications: NotificationItem[] = [
  {
    id: '1',
    type: 'booking',
    title: 'New Booking Received',
    message: 'Sarah Johnson booked "Paris City Tour" for 4 people',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    isRead: false,
    href: '/bookings/123',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Processed',
    message: 'Payment of $2,500 received for Mountain Adventure',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isRead: true,
    href: '/payments/456',
  },
  {
    id: '3',
    type: 'review',
    title: 'New 5-Star Review',
    message: 'Amazing experience! Highly recommend this tour.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    isRead: false,
    href: '/reviews/789',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getNotificationIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'booking':
      return FiCalendar;
    case 'payment':
      return FiCreditCard;
    case 'review':
      return FiUsers;
    case 'system':
      return FiClock;
    case 'marketing':
      return FiCheckCircle;
    default:
      return FiBell;
  }
};

const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: FiHome }
  ];
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Add icons for specific segments
    let icon;
    if (segment === 'dashboard') icon = FiHome;
    else if (segment === 'packages') icon = FiPackage;
    else if (segment === 'bookings') icon = FiCalendar;
    else if (segment === 'customers') icon = FiUsers;
    
    breadcrumbs.push({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: currentPath,
      icon,
    });
  });
  
  return breadcrumbs;
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

// ============================================================================
// COMPONENTS
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
  
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const filteredResults = searchResults.filter(result =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filteredResults);
      setIsLoading(false);
    }, 300);
  }, []);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [query, handleSearch]);
  
  const handleResultClick = (result: SearchResult) => {
    router.push(result.href);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="mx-auto mt-20 max-w-2xl bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search packages, bookings, customers..."
              className="pl-10 pr-4 py-3 text-lg border-0 focus:ring-0 bg-gray-50"
              autoFocus
            />
          </div>
          
          {query && (
            <div className="mt-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((result) => {
                    const IconComponent = result.icon;
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {result.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {result.subtitle}
                            </div>
                          </div>
                          {result.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {result.badge}
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

interface NotificationsProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onViewAll: () => void;
}

const NotificationsComponent: React.FC<NotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onViewAll,
}) => {
  const router = useRouter();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const handleNotificationClick = (notification: NotificationItem) => {
    onMarkAsRead(notification.id);
    if (notification.href) {
      router.push(notification.href);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <FiBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} new</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length > 0 ? (
          <>
            {notifications.slice(0, 5).map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`flex-shrink-0 mt-0.5 ${
                      notification.isRead ? 'text-gray-400' : 'text-blue-600'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        notification.isRead ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {notification.message}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.timestamp)}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
            
            {notifications.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onViewAll} className="text-center">
                  View all notifications
                </DropdownMenuItem>
              </>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            No notifications yet
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface UserProfileProps {
  user: any;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const router = useRouter();
  const { displayName, avatar, role } = useUserDisplay();
  
  const handleProfileClick = () => {
    router.push('/profile');
  };
  
  const handleSettingsClick = () => {
    router.push('/settings');
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatar} alt={displayName} />
            <AvatarFallback className="text-xs">{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick}>
          <FiUser className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettingsClick}>
          <FiSettings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FiCreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <FiLogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Header({
  className,
  variant = 'default',
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
  showBreadcrumbs = true,
  title,
  subtitle,
  actions,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsState, setNotificationsState] = useState(notifications);
  
  const breadcrumbs = getBreadcrumbs(pathname);
  const unreadNotifications = notificationsState.filter(n => !n.isRead).length;
  
  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
  };
  
  const handleNotificationMarkAsRead = (id: string) => {
    setNotificationsState(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };
  
  const handleViewAllNotifications = () => {
    router.push('/notifications');
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };
  
  const isCompact = variant === 'compact';
  const isTransparent = variant === 'transparent';
  
  return (
    <>
      <header className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        isTransparent && 'bg-transparent border-transparent',
        className
      )}>
        <div className="container flex h-14 items-center">
          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <FiMenu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <Button variant="ghost" className="w-full justify-start">
                  <FiHome className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FiPackage className="mr-2 h-4 w-4" />
                  Packages
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FiCalendar className="mr-2 h-4 w-4" />
                  Bookings
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FiUsers className="mr-2 h-4 w-4" />
                  Customers
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Breadcrumbs */}
          {showBreadcrumbs && !isCompact && (
            <nav className="hidden md:flex items-center space-x-2 text-sm">
              {breadcrumbs.map((breadcrumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const IconComponent = breadcrumb.icon;
                
                return (
                  <React.Fragment key={breadcrumb.href}>
                    {index > 0 && (
                      <FiChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    <button
                      onClick={() => router.push(breadcrumb.href)}
                      className={cn(
                        'flex items-center gap-1 hover:text-foreground transition-colors',
                        isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}
                    >
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <span>{breadcrumb.label}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>
          )}
          
          {/* Title and Subtitle */}
          {(title || subtitle) && !isCompact && (
            <div className="hidden md:block ml-6">
              {title && (
                <h1 className="text-lg font-semibold">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Actions */}
          {actions && (
            <div className="hidden md:flex items-center gap-2 mr-4">
              {actions}
            </div>
          )}
          
          {/* Search */}
          {showSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchToggle}
              className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <FiSearch className="h-4 w-4" />
              <span className="hidden lg:inline">Search...</span>
            </Button>
          )}
          
          {/* Notifications */}
          {showNotifications && (
            <NotificationsComponent
              notifications={notificationsState}
              onMarkAsRead={handleNotificationMarkAsRead}
              onViewAll={handleViewAllNotifications}
            />
          )}
          
          {/* User Menu */}
          {showUserMenu && user && (
            <UserProfile user={user} onLogout={handleLogout} />
          )}
        </div>
      </header>
      
      {/* Search Modal */}
      <SearchComponent isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}