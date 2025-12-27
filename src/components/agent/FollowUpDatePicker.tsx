'use client';

import React, { useState } from 'react';
import { FiCalendar, FiAlertCircle } from 'react-icons/fi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface FollowUpDatePickerProps {
  leadId: string;
  currentDate: string | null;
  onUpdate?: () => void;
}

const isOverdue = (dateString: string | null) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format for input
};

export function FollowUpDatePicker({ leadId, currentDate, onUpdate }: FollowUpDatePickerProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [dateValue, setDateValue] = useState(formatDate(currentDate) || '');

  const handleSetDate = async () => {
    if (!dateValue) {
      toast.error('Please select a date');
      return;
    }

    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({ next_follow_up_date: new Date(dateValue).toISOString() }),
      });

      if (response.ok) {
        toast.success('Follow-up date updated successfully');
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update follow-up date');
      }
    } catch (error) {
      console.error('Error updating follow-up date:', error);
      toast.error('Failed to update follow-up date');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDate = async () => {
    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({ next_follow_up_date: null }),
      });

      if (response.ok) {
        toast.success('Follow-up date cleared');
        setDateValue('');
        onUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to clear follow-up date');
      }
    } catch (error) {
      console.error('Error clearing follow-up date:', error);
      toast.error('Failed to clear follow-up date');
    } finally {
      setLoading(false);
    }
  };

  const overdue = isOverdue(currentDate);

  return (
    <div className="space-y-2">
      {currentDate && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Next Follow-up: {new Date(currentDate).toLocaleDateString()}
          </span>
          {overdue && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
              <FiAlertCircle className="w-3 h-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="pl-10"
            placeholder="Select follow-up date"
          />
        </div>
        <Button
          onClick={handleSetDate}
          disabled={loading || !dateValue}
          size="sm"
        >
          Set
        </Button>
        {currentDate && (
          <Button
            onClick={handleClearDate}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

