'use client';

import React, { useState } from 'react';
import { FiCheck, FiLock, FiX, FiAlertCircle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/CognitoAuthContext';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface ConfirmationWorkflowProps {
  itineraryId: string;
  isLocked: boolean;
  isConfirmed: boolean;
  onConfirm: () => void;
}

export function ConfirmationWorkflow({ 
  itineraryId, 
  isLocked, 
  isConfirmed,
  onConfirm 
}: ConfirmationWorkflowProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const handleConfirm = async () => {
    if (!confirmChecked) {
      toast.error('Please confirm that you want to proceed');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() || ''}`,
        },
        body: JSON.stringify({ lock: true }),
      });

      if (response.ok) {
        toast.success('Itinerary confirmed and locked successfully');
        onConfirm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to confirm itinerary');
      }
    } catch (error) {
      console.error('Error confirming itinerary:', error);
      toast.error('Failed to confirm itinerary');
    } finally {
      setLoading(false);
    }
  };

  if (isConfirmed && isLocked) {
    return (
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-full">
              <FiLock className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-900">Itinerary Confirmed & Locked</p>
              <p className="text-sm text-emerald-700">This itinerary has been confirmed and is locked for editing.</p>
            </div>
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
              Locked
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Confirm Itinerary</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-1">Important</p>
              <p className="text-sm text-amber-700">
                Confirming this itinerary will lock it and prevent further edits. Make sure all details are correct before proceeding.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="confirm-checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="confirm-checkbox" className="text-sm text-gray-700 cursor-pointer">
              I confirm that all itinerary details are correct and ready for confirmation.
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setConfirmChecked(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || !confirmChecked}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  Confirm & Lock Itinerary
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

