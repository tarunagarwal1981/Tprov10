'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LeadStage, getLeadStageLabel } from '@/lib/types/agent';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface LeadStageSelectorProps {
  leadId: string;
  currentStage: string;
  onUpdate?: () => void;
  variant?: 'dropdown' | 'badge';
}

const getStageBadgeColor = (stage: string) => {
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

export function LeadStageSelector({ leadId, currentStage, onUpdate, variant = 'dropdown' }: LeadStageSelectorProps) {
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleChange = async (newStage: string) => {
    if (newStage === currentStage) return;

    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({ stage: newStage }),
      });

      if (response.ok) {
        toast.success('Lead stage updated successfully');
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update stage');
      }
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast.error('Failed to update stage');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'badge') {
    return (
      <Badge className={getStageBadgeColor(currentStage)}>
        {getLeadStageLabel(currentStage as LeadStage)}
      </Badge>
    );
  }

  // Ensure currentStage is not empty string
  const safeStage = currentStage && currentStage.trim() !== '' ? currentStage : 'NEW';

  return (
    <Select
      value={safeStage}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="NEW">New</SelectItem>
        <SelectItem value="CONTACTED">Contacted</SelectItem>
        <SelectItem value="QUALIFIED">Qualified</SelectItem>
        <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
        <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
        <SelectItem value="WON">Won</SelectItem>
        <SelectItem value="LOST">Lost</SelectItem>
        <SelectItem value="ARCHIVED">Archived</SelectItem>
      </SelectContent>
    </Select>
  );
}

