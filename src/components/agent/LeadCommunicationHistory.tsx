'use client';

import React, { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiMessageCircle, FiVideo, FiMoreVertical, FiFilter, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';
import { AddCommunicationForm } from './AddCommunicationForm';

interface LeadCommunication {
  id: string;
  lead_id: string;
  agent_id: string | null;
  sub_agent_id: string | null;
  communication_type: 'email' | 'phone_call' | 'app_message' | 'whatsapp' | 'meeting' | 'other';
  direction: 'outbound' | 'inbound';
  subject: string | null;
  content: string | null;
  sent_at: string | null;
  received_at: string | null;
  customer_response: 'positive' | 'negative' | 'no_response' | 'pending' | null;
  response_notes: string | null;
  attachments: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface LeadCommunicationHistoryProps {
  leadId: string;
}

const getCommunicationIcon = (type: string) => {
  switch (type) {
    case 'email':
      return FiMail;
    case 'phone_call':
      return FiPhone;
    case 'whatsapp':
      return FiMessageCircle;
    case 'app_message':
      return FiMessageCircle;
    case 'meeting':
      return FiVideo;
    default:
      return FiMoreVertical;
  }
};

const getCommunicationColor = (type: string) => {
  switch (type) {
    case 'email':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'phone_call':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'whatsapp':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'app_message':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'meeting':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getResponseBadgeColor = (response: string | null) => {
  switch (response) {
    case 'positive':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'negative':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'no_response':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const groupByDate = (communications: LeadCommunication[]) => {
  const groups: Record<string, LeadCommunication[]> = {};
  
  communications.forEach(comm => {
    const date = new Date(comm.created_at);
    const dateKey = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(comm);
  });
  
  return groups;
};

export function LeadCommunicationHistory({ leadId }: LeadCommunicationHistoryProps) {
  const toast = useToast();
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    type: '' as string,
    direction: '' as string,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCommunications();
  }, [leadId]);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const accessToken = getAccessToken();
      const response = await fetch(`/api/leads/${leadId}/communications`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });
      if (response.ok) {
        const { communications: comms } = await response.json();
        setCommunications(comms || []);
      } else {
        if (response.status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else {
          toast.error('Failed to fetch communication history');
        }
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
      toast.error('Failed to fetch communication history');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommunication = () => {
    setShowAddForm(true);
  };

  const handleCommunicationAdded = () => {
    setShowAddForm(false);
    fetchCommunications();
  };

  const filteredCommunications = communications.filter(comm => {
    if (filters.type && comm.communication_type !== filters.type) return false;
    if (filters.direction && comm.direction !== filters.direction) return false;
    return true;
  });

  const groupedCommunications = groupByDate(filteredCommunications);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Communication History</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs"
            >
              <FiFilter className="w-3 h-3 mr-1" />
              Filter
            </Button>
            <Button
              size="sm"
              onClick={handleAddCommunication}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Add Communication
            </Button>
          </div>
        </div>
        {showFilters && (
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Type:</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="email">Email</option>
                <option value="phone_call">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="app_message">App Message</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Direction:</label>
              <select
                value={filters.direction}
                onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value }))}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
            {(filters.type || filters.direction) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ type: '', direction: '' })}
                className="text-xs h-6"
              >
                <FiX className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {filteredCommunications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No communications recorded yet</p>
            <Button
              size="sm"
              onClick={handleAddCommunication}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Add First Communication
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCommunications).map(([dateKey, comms]) => (
              <div key={dateKey} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-gray-300 flex-1"></div>
                  <h3 className="text-sm font-semibold text-gray-700 px-2">{dateKey}</h3>
                  <div className="h-px bg-gray-300 flex-1"></div>
                </div>
                <div className="relative pl-8 space-y-4">
                  {/* Vertical line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-blue-200"></div>
                  
                  {comms.map((comm, index) => {
                    const Icon = getCommunicationIcon(comm.communication_type);
                    const iconColor = getCommunicationColor(comm.communication_type);
                    const responseColor = getResponseBadgeColor(comm.customer_response);
                    
                    return (
                      <div key={comm.id} className="relative flex items-start gap-4 group">
                        {/* Timeline dot */}
                        <div className={`absolute left-0 w-6 h-6 rounded-full ${iconColor} border-2 border-white shadow-sm flex items-center justify-center z-10`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        
                        {/* Content card */}
                        <Card className="flex-1 border-gray-200 hover:shadow-md transition-shadow bg-white">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-xs ${iconColor}`}>
                                  {comm.communication_type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                                  {comm.direction}
                                </Badge>
                                {comm.customer_response && (
                                  <Badge variant="outline" className={`text-xs ${responseColor}`}>
                                    {comm.customer_response.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDate(comm.sent_at || comm.received_at || comm.created_at)}
                              </span>
                            </div>
                            
                            {comm.subject && (
                              <h4 className="text-sm font-semibold text-gray-900 mb-1">{comm.subject}</h4>
                            )}
                            
                            {comm.content && (
                              <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{comm.content}</p>
                            )}
                            
                            {comm.response_notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">Response Notes:</span> {comm.response_notes}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {showAddForm && (
        <AddCommunicationForm
          leadId={leadId}
          open={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSuccess={handleCommunicationAdded}
        />
      )}
    </Card>
  );
}

