'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AgentDashboardLayout } from '@/components/dashboard/AgentDashboardLayout';
import { UserRole } from '@/lib/types';

const OPERATIONS_ROLES: UserRole[] = ['OPERATIONS', 'ADMIN', 'SUPER_ADMIN'];

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={OPERATIONS_ROLES}>
      <AgentDashboardLayout>
        {children}
      </AgentDashboardLayout>
    </ProtectedRoute>
  );
}

