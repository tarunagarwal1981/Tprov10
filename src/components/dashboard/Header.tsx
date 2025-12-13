'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch as Search, 
  FiBell as Bell, 
  FiSettings as Settings, 
  FiUser as User, 
  FiLogOut as LogOut, 
  FiChevronDown as ChevronDown,
  FiMenu as Menu,
  FiX as X
} from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/CognitoAuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState([
    { id: 1, title: 'New booking received', time: '2 min ago', unread: true },
    { id: 2, title: 'Package approved', time: '1 hour ago', unread: true },
    { id: 3, title: 'Payment processed', time: '3 hours ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2">
        {/* Left Section - Search */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search packages, bookings, agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-[#FF6B35] transition-colors"
            />
          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex items-start gap-3 p-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      notification.unread ? "bg-[#FF6B35]" : "bg-slate-300"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-[#FF6B35] hover:text-[#E05A2A]">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={(user as any)?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#FF4B8C] text-white text-sm">
                    {(user as any)?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-900">
                    {(user as any)?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.role === 'TRAVEL_AGENT' ? 'Travel Agent' : 
                     user?.role === 'TOUR_OPERATOR' ? 'Tour Operator' : 
                     user?.role || 'User'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {(user as any)?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {(user as any)?.email || 'user@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  console.log('[Header] Profile clicked, navigating to /agent/profile');
                  router.push('/agent/profile');
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  console.log('[Header] Settings clicked, navigating to /agent/onboarding');
                  router.push('/agent/onboarding');
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  console.log('[Header] Logout clicked');
                  logout();
                }}
                className="text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
