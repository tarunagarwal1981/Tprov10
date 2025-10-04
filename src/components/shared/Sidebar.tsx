/**
 * Premium Sidebar Component
 * Modern, sleek sidebar with glassmorphism effect and role-based navigation
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useRBAC, useUserDisplay } from '@/context/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Package,
  Calendar,
  BarChart3,
  Settings,
  Star,
  CalendarDays,
  DollarSign,
  ShoppingBag,
  MapPin,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  Moon,
  Sun,
  Bell,
  HelpCircle,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  submenu?: NavigationItem[];
}

interface SidebarProps {
  className?: string;
}

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

const ADMIN_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'users',
    label: 'Users Management',
    href: '/admin/users',
    icon: Users,
    badge: 12,
  },
  {
    id: 'operators',
    label: 'Tour Operators',
    href: '/admin/operators',
    icon: Building2,
    badge: 5,
  },
  {
    id: 'agents',
    label: 'Travel Agents',
    href: '/admin/agents',
    icon: Briefcase,
    badge: 23,
  },
  {
    id: 'packages',
    label: 'Packages',
    href: '/admin/packages',
    icon: Package,
    badge: 8,
  },
  {
    id: 'bookings',
    label: 'Bookings',
    href: '/admin/bookings',
    icon: Calendar,
    badge: 156,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

const TOUR_OPERATOR_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/operator/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'packages',
    label: 'My Packages',
    href: '/operator/packages',
    icon: Package,
    submenu: [
      {
        id: 'all-packages',
        label: 'All Packages',
        href: '/operator/packages',
        icon: Package,
      },
      {
        id: 'create-package',
        label: 'Create New',
        href: '/operator/packages/create',
        icon: Package,
      },
      {
        id: 'drafts',
        label: 'Drafts',
        href: '/operator/packages/drafts',
        icon: Package,
        badge: 3,
      },
    ],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    href: '/operator/bookings',
    icon: Calendar,
    submenu: [
      {
        id: 'all-bookings',
        label: 'All Bookings',
        href: '/operator/bookings',
        icon: Calendar,
      },
      {
        id: 'pending-bookings',
        label: 'Pending',
        href: '/operator/bookings/pending',
        icon: Calendar,
        badge: 7,
      },
      {
        id: 'confirmed-bookings',
        label: 'Confirmed',
        href: '/operator/bookings/confirmed',
        icon: Calendar,
      },
      {
        id: 'completed-bookings',
        label: 'Completed',
        href: '/operator/bookings/completed',
        icon: Calendar,
      },
    ],
  },
  {
    id: 'reviews',
    label: 'Reviews',
    href: '/operator/reviews',
    icon: Star,
    badge: 24,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/operator/analytics',
    icon: BarChart3,
  },
  {
    id: 'availability',
    label: 'Availability',
    href: '/operator/availability',
    icon: CalendarDays,
  },
  {
    id: 'earnings',
    label: 'Earnings',
    href: '/operator/earnings',
    icon: DollarSign,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/operator/settings',
    icon: Settings,
  },
];

const TRAVEL_AGENT_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/agent/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'leads',
    label: 'Leads',
    href: '/agent/leads',
    icon: Users,
    badge: 8,
    submenu: [
      {
        id: 'all-leads',
        label: 'All Leads',
        href: '/agent/leads',
        icon: Users,
      },
      {
        id: 'pipeline',
        label: 'Pipeline',
        href: '/agent/leads/pipeline',
        icon: Users,
      },
      {
        id: 'add-lead',
        label: 'Add New',
        href: '/agent/leads/new',
        icon: Users,
      },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    href: '/agent/marketplace',
    icon: ShoppingBag,
    submenu: [
      {
        id: 'browse-packages',
        label: 'Browse Packages',
        href: '/agent/marketplace',
        icon: ShoppingBag,
      },
      {
        id: 'favorites',
        label: 'Favorites',
        href: '/agent/marketplace/favorites',
        icon: ShoppingBag,
        badge: 12,
      },
      {
        id: 'recent',
        label: 'Recent',
        href: '/agent/marketplace/recent',
        icon: ShoppingBag,
      },
    ],
  },
  {
    id: 'itineraries',
    label: 'Itineraries',
    href: '/agent/itineraries',
    icon: MapPin,
    submenu: [
      {
        id: 'all-itineraries',
        label: 'All Itineraries',
        href: '/agent/itineraries',
        icon: MapPin,
      },
      {
        id: 'create-itinerary',
        label: 'Create New',
        href: '/agent/itineraries/create',
        icon: MapPin,
      },
      {
        id: 'templates',
        label: 'Templates',
        href: '/agent/itineraries/templates',
        icon: MapPin,
      },
    ],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    href: '/agent/bookings',
    icon: Calendar,
    badge: 15,
    submenu: [
      {
        id: 'all-bookings',
        label: 'All Bookings',
        href: '/agent/bookings',
        icon: Calendar,
      },
      {
        id: 'pending-bookings',
        label: 'Pending',
        href: '/agent/bookings/pending',
        icon: Calendar,
        badge: 5,
      },
      {
        id: 'confirmed-bookings',
        label: 'Confirmed',
        href: '/agent/bookings/confirmed',
        icon: Calendar,
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/agent/customers',
    icon: UserCircle,
  },
  {
    id: 'commissions',
    label: 'Commissions',
    href: '/agent/commissions',
    icon: DollarSign,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/agent/settings',
    icon: Settings,
  },
];

// ============================================================================
// NAVIGATION ITEM COMPONENT
// ============================================================================

interface NavigationItemProps {
  item: NavigationItem;
  isCollapsed: boolean;
  isActive: boolean;
  isSubmenu?: boolean;
  onClick: () => void;
}

const NavigationItemComponent: React.FC<NavigationItemProps> = ({
  item,
  isCollapsed,
  isActive,
  isSubmenu = false,
  onClick,
}) => {
  const Icon = item.icon;

  const itemContent = (
    <motion.div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        'hover:bg-white/60 dark:hover:bg-zinc-800/60',
        'hover:shadow-sm hover:-translate-y-0.5',
        isActive && 'bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/20',
        isActive && 'border-l-2 border-indigo-500',
        isSubmenu && 'ml-6 text-sm',
        isCollapsed && 'justify-center px-2'
      )}
      whileHover={{ 
        y: -1,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <Icon 
        className={cn(
          'h-5 w-5 flex-shrink-0',
          isActive && 'text-indigo-600 dark:text-indigo-400',
          !isActive && 'text-zinc-600 dark:text-zinc-400'
        )} 
      />
      
      {!isCollapsed && (
        <>
          <span 
            className={cn(
              'font-medium truncate',
              isActive && 'text-indigo-700 dark:text-indigo-300',
              !isActive && 'text-zinc-700 dark:text-zinc-300'
            )}
          >
            {item.label}
          </span>
          
          {item.badge && (
            <Badge 
              variant="secondary" 
              className="ml-auto bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </motion.div>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {itemContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return itemContent;
};

// ============================================================================
// SUBMENU COMPONENT
// ============================================================================

interface SubmenuProps {
  items: NavigationItem[];
  isCollapsed: boolean;
  activePath: string;
  onNavigate: (href: string) => void;
}

const Submenu: React.FC<SubmenuProps> = ({ items, isCollapsed, activePath, onNavigate }) => {
  if (isCollapsed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="space-y-1 mt-1">
        {items.map((subItem) => (
          <NavigationItemComponent
            key={subItem.id}
            item={subItem}
            isCollapsed={isCollapsed}
            isActive={activePath === subItem.href}
            isSubmenu
            onClick={() => onNavigate(subItem.href)}
          />
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { userRole, hasRole } = useRBAC();
  const { displayName, displayAvatar, initials } = useUserDisplay();
  const { theme, setTheme } = useTheme();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleNavigate = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  // ============================================================================
  // NAVIGATION DATA
  // ============================================================================

  const getNavigationItems = useCallback((): NavigationItem[] => {
    if (hasRole('ADMIN') || hasRole('SUPER_ADMIN')) {
      return ADMIN_NAVIGATION;
    } else if (hasRole('TOUR_OPERATOR')) {
      return TOUR_OPERATOR_NAVIGATION;
    } else if (hasRole('TRAVEL_AGENT')) {
      return TRAVEL_AGENT_NAVIGATION;
    }
    return [];
  }, [hasRole]);

  const navigationItems = getNavigationItems();

  // ============================================================================
  // RENDER
  // ============================================================================

  const sidebarContent = (
    <motion.div
      className={cn(
        'flex flex-col h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl',
        'border-r border-zinc-200/50 dark:border-zinc-800/50',
        'shadow-lg shadow-zinc-200/20 dark:shadow-zinc-900/20',
        isCollapsed ? 'w-20' : 'w-72',
        'transition-all duration-300 ease-in-out'
      )}
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              TravelPro
            </h1>
          </motion.div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isActive = pathname === item.href || (hasSubmenu && item.submenu?.some(sub => pathname === sub.href));

            return (
              <div key={item.id}>
                <NavigationItemComponent
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={isActive}
                  onClick={() => {
                    if (hasSubmenu) {
                      toggleExpanded(item.id);
                    } else {
                      handleNavigate(item.href);
                    }
                  }}
                />
                
                {hasSubmenu && (
                  <AnimatePresence>
                    {isExpanded && (
                      <Submenu
                        items={item.submenu!}
                        isCollapsed={isCollapsed}
                        activePath={pathname}
                        onNavigate={handleNavigate}
                      />
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 p-4">
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* User Profile Card */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayAvatar || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {userRole}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate('/profile')}
                className="justify-start text-xs"
              >
                <User className="h-3 w-3 mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate('/settings')}
                className="justify-start text-xs"
              >
                <Settings className="h-3 w-3 mr-2" />
                Settings
              </Button>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full justify-start text-xs"
            >
              {theme === 'dark' ? (
                <Sun className="h-3 w-3 mr-2" />
              ) : (
                <Moon className="h-3 w-3 mr-2" />
              )}
              {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-3 w-3 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigate('/profile')}
                    className="h-8 w-8 p-0"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Profile</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="h-8 w-8 p-0"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{theme === 'dark' ? 'Light' : 'Dark'} Mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn('hidden lg:block', className)}>
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsMobileOpen(false)}
              />
              
              <motion.div
                initial={{ x: -288 }}
                animate={{ x: 0 }}
                exit={{ x: -288 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed left-0 top-0 h-full w-72 z-50"
              >
                <div className="relative h-full">
                  {sidebarContent}
                  
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileOpen(false)}
                    className="absolute top-4 right-4 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Sidebar;
