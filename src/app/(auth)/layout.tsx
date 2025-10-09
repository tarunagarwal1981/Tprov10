import React from 'react';

/**
 * Auth Layout
 * 
 * Layout for authentication pages (login, register)
 * These pages don't need the marketing header/footer
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

