'use client';

import React from 'react';
import { AgentDashboardLayout } from '@/components/dashboard/AgentDashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/types';

const AGENT_ROLES: UserRole[] = ['TRAVEL_AGENT', 'ADMIN', 'SUPER_ADMIN'];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={AGENT_ROLES}>
      <AgentDashboardLayout>
        {children}
      </AgentDashboardLayout>
    </ProtectedRoute>
  );
}

