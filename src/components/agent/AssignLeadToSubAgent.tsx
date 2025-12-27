'use client';

import React, { useState, useEffect } from 'react';
import { FiUser, FiX, FiCheck, FiUsers } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/CognitoAuthContext';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface SubAgent {
  id: string;
  email: string;
  name: string;
  assignedLeadsCount: number;
}

interface AssignLeadToSubAgentProps {
  leadId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignLeadToSubAgent({ leadId, open, onClose, onSuccess }: AssignLeadToSubAgentProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubAgentId, setSelectedSubAgentId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      fetchSubAgents();
    }
  }, [open, user?.id]);

  const fetchSubAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents/sub-agents', {
        headers: {
          'Authorization': `Bearer ${getAccessToken() || ''}`,
        },
      });
      if (response.ok) {
        const { subAgents: agents } = await response.json();
        setSubAgents(agents || []);
      } else {
        toast.error('Failed to fetch sub-agents');
      }
    } catch (error) {
      console.error('Error fetching sub-agents:', error);
      toast.error('Failed to fetch sub-agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedSubAgentId) {
      toast.error('Please select a sub-agent');
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() || ''}`,
        },
        body: JSON.stringify({
          sub_agent_id: selectedSubAgentId,
        }),
      });

      if (response.ok) {
        toast.success('Lead assigned to sub-agent successfully');
        setSelectedSubAgentId(null);
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign lead');
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('Failed to assign lead');
    } finally {
      setAssigning(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md mx-4 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Assign Lead to Sub-Agent</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <FiX className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : subAgents.length === 0 ? (
            <div className="text-center py-8">
              <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No sub-agents available</p>
              <p className="text-sm text-gray-400">Create a sub-agent first to assign leads</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Select a sub-agent to assign this lead to:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {subAgents.map((subAgent) => (
                  <button
                    key={subAgent.id}
                    type="button"
                    onClick={() => setSelectedSubAgentId(subAgent.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedSubAgentId === subAgent.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{subAgent.name}</p>
                        <p className="text-sm text-gray-600">{subAgent.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {subAgent.assignedLeadsCount} {subAgent.assignedLeadsCount === 1 ? 'lead' : 'leads'} assigned
                        </p>
                      </div>
                      {selectedSubAgentId === subAgent.id && (
                        <FiCheck className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={assigning || !selectedSubAgentId}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {assigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4 mr-2" />
                      Assign Lead
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

