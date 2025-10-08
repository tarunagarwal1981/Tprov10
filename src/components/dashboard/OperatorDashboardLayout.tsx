'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OperatorSidebar from './OperatorSidebar';
import { Header } from './Header';

interface OperatorDashboardLayoutProps {
  children: React.ReactNode;
}

export function OperatorDashboardLayout({ children }: OperatorDashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [leftMarginPx, setLeftMarginPx] = useState(280);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const computeSidebarWidth = useCallback(() => (isSidebarCollapsed ? 80 : 280), [isSidebarCollapsed]);

  const syncMargin = useCallback(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    setLeftMarginPx(isDesktop ? computeSidebarWidth() : 0);
  }, [computeSidebarWidth]);

  // Initialize collapsed state and margin on mount from persisted preference
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("operator-sidebar-collapsed");
      if (saved) {
        const collapsed = JSON.parse(saved);
        setIsSidebarCollapsed(Boolean(collapsed));
      }
    } catch {}
    // Set initial margin based on current sidebar state
    syncMargin();
  }, [syncMargin]);

  const handleMenuToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileMenuOpen((v) => !v);
    } else {
      setIsSidebarCollapsed((v) => !v);
    }
  };

  React.useEffect(() => {
    // Ensure margin is set immediately on mount
    syncMargin();

    // Also set it after a short delay to handle any async initialization
    const timeoutId = setTimeout(() => {
      syncMargin();
    }, 100);
    
    const onResize = () => syncMargin();
    window.addEventListener('resize', onResize);
    const onSidebarToggled = (e: Event) => {
      const detail = (e as CustomEvent).detail as { collapsed?: boolean };
      if (typeof detail?.collapsed === 'boolean') {
        setIsSidebarCollapsed(detail.collapsed);
      }
      syncMargin();
    };
    window.addEventListener('operator-sidebar-toggled', onSidebarToggled as EventListener);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('operator-sidebar-toggled', onSidebarToggled as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncMargin]);

  React.useEffect(() => {
    syncMargin();
  }, [isSidebarCollapsed, syncMargin]);

  // Ensure margin is applied directly to the element
  useEffect(() => {
    if (mainContentRef.current) {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      const margin = isDesktop ? computeSidebarWidth() : 0;
      mainContentRef.current.style.marginLeft = `${margin}px`;
    }
  }, [isSidebarCollapsed, leftMarginPx, computeSidebarWidth]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <OperatorSidebar />

      {/* Main Content Area - With responsive left margin */}
      <div 
        ref={mainContentRef}
        className="transition-all duration-300" 
        style={{ marginLeft: leftMarginPx }}
        data-sidebar-collapsed={isSidebarCollapsed}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="p-2 sm:p-3 lg:p-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>
    </div>
  );
}