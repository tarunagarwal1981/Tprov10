'use client';

import React from 'react';
import { OperatorDashboardLayout } from '@/components/dashboard/OperatorDashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const OPERATOR_ROLES = ['TOUR_OPERATOR', 'ADMIN', 'SUPER_ADMIN'];

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={OPERATOR_ROLES}>
      <OperatorDashboardLayout>
        {children}
      </OperatorDashboardLayout>
    </ProtectedRoute>
  );
}
