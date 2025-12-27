'use client';

import React, { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiTrash2, FiMail, FiPhone, FiUser, FiPackage, FiEdit2 } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';
import { CreateSubAgentForm } from '@/components/agent/CreateSubAgentForm';

interface SubAgent {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  parent_agent_id: string | null;
  created_at: string;
  assignedLeadsCount: number;
}

export default function SubAgentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSubAgents();
    }
  }, [user?.id]);

  const fetchSubAgents = async () => {
    try {
      setLoading(true);
      const accessToken = getAccessToken();
      if (!accessToken) {
        toast.error('Please log in again');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/agents/sub-agents', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

  const handleDeleteSubAgent = async (subAgentId: string, subAgentName: string) => {
    if (!confirm(`Are you sure you want to delete "${subAgentName}"?\n\nThis will remove all their assignments and cannot be undone.`)) {
      return;
    }

    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
          toast.error('Please log in again');
          return;
        }

        const response = await fetch(`/api/agents/sub-agents/${subAgentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

      if (response.ok) {
        toast.success('Sub-agent deleted successfully');
        fetchSubAgents();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete sub-agent');
      }
    } catch (error) {
      console.error('Error deleting sub-agent:', error);
      toast.error('Failed to delete sub-agent');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sub-agents...</p>
        </div>
      </div>
    );
  }

  const totalSubAgents = subAgents.length;
  const totalAssignments = subAgents.reduce((sum, agent) => sum + agent.assignedLeadsCount, 0);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sub-Agent Management</h1>
        <p className="text-gray-600 mt-2">Create and manage sub-agents for your team</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sub-Agents</p>
                <p className="text-2xl font-bold text-gray-900">{totalSubAgents}</p>
              </div>
              <FiUsers className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
              </div>
              <FiPackage className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Sub-Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subAgents.filter(a => a.assignedLeadsCount > 0).length}
                </p>
              </div>
              <FiUser className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Sub-Agents</h2>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Create Sub-Agent
        </Button>
      </div>

      {/* Sub-Agents List */}
      {subAgents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No sub-agents created yet</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Create Your First Sub-Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subAgents.map((subAgent) => (
            <Card key={subAgent.id} className="hover:shadow-lg transition-shadow border-gray-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">{subAgent.name}</CardTitle>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                    Sub-Agent
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FiMail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{subAgent.email}</span>
                  </div>
                  {subAgent.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiPhone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{subAgent.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <FiPackage className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {subAgent.assignedLeadsCount} {subAgent.assignedLeadsCount === 1 ? 'lead' : 'leads'} assigned
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubAgent(subAgent.id, subAgent.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateSubAgentForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchSubAgents();
          }}
        />
      )}
    </div>
  );
}

