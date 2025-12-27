'use client';

import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { LeadStage, LeadPriority, getLeadStageLabel, getLeadPriorityLabel } from '@/lib/types/agent';

interface StageBadgeProps {
  stage: string;
}

interface PriorityBadgeProps {
  priority: string;
}

interface OverdueBadgeProps {
  date: string | null;
}

export function StageBadge({ stage }: StageBadgeProps) {
  const getColor = (stage: string) => {
    const stageMap: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-700 border-blue-200',
      CONTACTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      QUALIFIED: 'bg-green-100 text-green-700 border-green-200',
      PROPOSAL_SENT: 'bg-purple-100 text-purple-700 border-purple-200',
      NEGOTIATION: 'bg-orange-100 text-orange-700 border-orange-200',
      WON: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      LOST: 'bg-red-100 text-red-700 border-red-200',
      ARCHIVED: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return stageMap[stage] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <Badge className={getColor(stage)}>
      {getLeadStageLabel(stage as LeadStage)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getColor = (priority: string) => {
    const priorityMap: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-700 border-gray-200',
      MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
      HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
      URGENT: 'bg-red-100 text-red-700 border-red-200',
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <Badge className={getColor(priority)}>
      {getLeadPriorityLabel(priority as LeadPriority)}
    </Badge>
  );
}

export function OverdueBadge({ date }: OverdueBadgeProps) {
  if (!date) return null;

  const isOverdue = new Date(date) < new Date();
  if (!isOverdue) return null;

  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
      <FiAlertCircle className="w-3 h-3 mr-1" />
      Overdue
    </Badge>
  );
}

