'use client';

import React, { useState } from 'react';
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

  const computeSidebarWidth = () => (isSidebarCollapsed ? 80 : 280);

  const syncMargin = () => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    setLeftMarginPx(isDesktop ? computeSidebarWidth() : 0);
  };

  const handleMenuToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileMenuOpen((v) => !v);
    } else {
      setIsSidebarCollapsed((v) => !v);
    }
  };

  React.useEffect(() => {
    syncMargin();
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
      window.removeEventListener('resize', onResize);
      window.removeEventListener('operator-sidebar-toggled', onSidebarToggled as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    syncMargin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <OperatorSidebar />

      {/* Main Content Area - With responsive left margin */}
      <div className="transition-all duration-300" style={{ marginLeft: leftMarginPx }}>
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
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