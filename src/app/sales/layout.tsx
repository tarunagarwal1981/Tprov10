'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AgentDashboardLayout } from '@/components/dashboard/AgentDashboardLayout';
import { UserRole } from '@/lib/types';

const SALES_ROLES: UserRole[] = ['SALES', 'ADMIN', 'SUPER_ADMIN'];

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={SALES_ROLES}>
      <AgentDashboardLayout>
        {children}
      </AgentDashboardLayout>
    </ProtectedRoute>
  );
}

