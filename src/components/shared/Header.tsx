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
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { createClient } from '@/lib/supabase/client';

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

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const q = searchQuery.toLowerCase();
      // basic fuzzy-like filter
      const filtered = searchResults.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q)
      );
      setResults(filtered);
      setIsLoading(false);
    }, 250);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => performSearch(query), 200);
    return () => clearTimeout(id);
  }, [query, performSearch]);

  const handleSelect = (res: SearchResult) => {
    router.push(res.href);
    onClose();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <CommandInput
        placeholder="Search packages, bookings, customers..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && <div className="py-3 text-center text-sm">Searching…</div>}
        <CommandEmpty>No results found.</CommandEmpty>
        {!isLoading && results.length > 0 && (
          <>
            <CommandGroup heading="Results">
              {results.map((res) => (
                <CommandItem key={res.id} onSelect={() => handleSelect(res)}>
                  <res.icon className="mr-2 h-4 w-4 opacity-70" />
                  <span className="truncate">{res.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground truncate">{res.subtitle}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Recent">
          <CommandItem onSelect={() => { setQuery(''); }}>
            <FiClock className="mr-2 h-4 w-4 opacity-70" />
            <span>Recent search 1</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
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
  const [isScrolled, setIsScrolled] = useState(false);

  // Smooth shadow on scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cmd/Ctrl+K to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Supabase realtime notifications
  useEffect(() => {
    let channel: any;
    try {
      const supabase = createClient();
      channel = supabase
        .channel('notifications-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as NotificationItem;
            setNotificationsState(prev => [
              { ...newItem, timestamp: new Date(newItem.timestamp) },
              ...prev,
            ]);
          }
        })
        .subscribe();
    } catch {}
    return () => {
      try { channel && channel.unsubscribe && channel.unsubscribe(); } catch {}
    };
  }, []);

  const breadcrumbs = getBreadcrumbs(pathname || "");
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
      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b border-zinc-200/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl transition-shadow',
          isScrolled ? 'shadow-md shadow-zinc-200/20 dark:shadow-zinc-900/30' : 'shadow-none',
          isTransparent && 'bg-transparent border-transparent shadow-none',
          className
        )}
        role="banner"
        aria-label="Global Header"
      >
        <div className="flex h-7 md:h-8 items-center px-2 md:px-3">
          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open menu">
                <FiMenu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64" aria-label="Mobile navigation">
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
            <nav className="hidden md:flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
              {breadcrumbs.map((breadcrumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const IconComponent = breadcrumb.icon;
                return (
                  <React.Fragment key={breadcrumb.href}>
                    {index > 0 && (
                      <FiChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    )}
                    <button
                      onClick={() => router.push(breadcrumb.href)}
                      className={cn(
                        'flex items-center gap-1 hover:text-foreground transition-colors',
                        isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {IconComponent && <IconComponent className="h-4 w-4" aria-hidden="true" />}
                      <span className="truncate max-w-[200px]" title={breadcrumb.label}>{breadcrumb.label}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          {/* Center: Search trigger on desktop, logo on mobile */}
          <div className="flex-1" />

          {showSearch && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchToggle}
                className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground"
                aria-label="Open search"
              >
                <FiSearch className="h-4 w-4" />
                <span className="hidden lg:inline">Search...</span>
                <span className="ml-2 hidden lg:inline text-xs text-muted-foreground">⌘K</span>
              </Button>

              {/* Mobile search icon */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchToggle}
                className="md:hidden"
                aria-label="Open search"
              >
                <FiSearch className="h-5 w-5" />
              </Button>
            </>
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

      {/* Search Command Palette */}
      <SearchComponent isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}