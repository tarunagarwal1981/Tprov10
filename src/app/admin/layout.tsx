'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/types';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={ADMIN_ROLES}>
      {children}
    </ProtectedRoute>
  );
}

