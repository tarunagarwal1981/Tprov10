'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LeadPriority, getLeadPriorityLabel } from '@/lib/types/agent';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface LeadPrioritySelectorProps {
  leadId: string;
  currentPriority: string;
  onUpdate?: () => void;
  variant?: 'dropdown' | 'badge';
}

const getPriorityBadgeColor = (priority: string) => {
  const priorityMap: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-700 border-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    URGENT: 'bg-red-100 text-red-700 border-red-200',
  };
  return priorityMap[priority] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export function LeadPrioritySelector({ leadId, currentPriority, onUpdate, variant = 'dropdown' }: LeadPrioritySelectorProps) {
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleChange = async (newPriority: string) => {
    if (newPriority === currentPriority) return;

    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (response.ok) {
        toast.success('Lead priority updated successfully');
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating lead priority:', error);
      toast.error('Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'badge') {
    return (
      <Badge className={getPriorityBadgeColor(currentPriority)}>
        {getLeadPriorityLabel(currentPriority as LeadPriority)}
      </Badge>
    );
  }

  // Ensure currentPriority is not empty string
  const safePriority = currentPriority && currentPriority.trim() !== '' ? currentPriority : 'MEDIUM';

  return (
    <Select
      value={safePriority}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="LOW">Low</SelectItem>
        <SelectItem value="MEDIUM">Medium</SelectItem>
        <SelectItem value="HIGH">High</SelectItem>
        <SelectItem value="URGENT">Urgent</SelectItem>
      </SelectContent>
    </Select>
  );
}

