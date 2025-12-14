'use client';

import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, Ban } from 'lucide-react';
import { PaymentStatus } from '@/lib/services/paymentService';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Payment Status Badge Component
 * 
 * Displays payment status with appropriate color and icon
 */
export function PaymentStatusBadge({
  status,
  className = '',
  showIcon = true,
  size = 'md',
}: PaymentStatusBadgeProps) {
  const statusConfig = {
    [PaymentStatus.PENDING]: {
      label: 'Pending',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      iconColor: 'text-yellow-600',
    },
    [PaymentStatus.PROCESSING]: {
      label: 'Processing',
      icon: RefreshCw,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      iconColor: 'text-blue-600',
    },
    [PaymentStatus.COMPLETED]: {
      label: 'Completed',
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800 border-green-200',
      iconColor: 'text-green-600',
    },
    [PaymentStatus.FAILED]: {
      label: 'Failed',
      icon: XCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
      iconColor: 'text-red-600',
    },
    [PaymentStatus.CANCELLED]: {
      label: 'Cancelled',
      icon: Ban,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      iconColor: 'text-gray-600',
    },
    [PaymentStatus.REFUNDED]: {
      label: 'Refunded',
      icon: RefreshCw,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      iconColor: 'text-purple-600',
    },
    [PaymentStatus.PARTIALLY_REFUNDED]: {
      label: 'Partially Refunded',
      icon: AlertCircle,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      iconColor: 'text-orange-600',
    },
  };

  const config = statusConfig[status] || statusConfig[PaymentStatus.PENDING];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor}`} />}
      <span>{config.label}</span>
    </span>
  );
}
