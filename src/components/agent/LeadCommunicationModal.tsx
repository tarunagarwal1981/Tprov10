'use client';

import React, { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiMessageCircle, FiVideo, FiMoreVertical, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface LeadCommunicationModalProps {
  leadId: string;
  open: boolean;
  onClose: () => void;
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

export function LeadCommunicationModal({ leadId, open, onClose }: LeadCommunicationModalProps) {
  const toast = useToast();
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (open && leadId) {
      fetchCommunications();
    }
  }, [open, leadId]);

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

  const handleCommunicationAdded = () => {
    setShowAddForm(false);
    fetchCommunications();
  };

  const groupedCommunications = groupByDate(communications);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          size="lg" 
          className="max-h-[80vh] flex flex-col p-0 bg-white border-gray-200"
          overlayVariant="subtle"
        >
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white">
            <DialogTitle className="text-base font-semibold text-gray-900">Communications</DialogTitle>
          </DialogHeader>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : communications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-3 text-sm">No communications recorded yet</p>
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  Add First Communication
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedCommunications).map(([dateKey, comms]) => (
                  <div key={dateKey} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-gray-300 flex-1"></div>
                      <h3 className="text-xs font-semibold text-gray-700 px-2 whitespace-nowrap">{dateKey}</h3>
                      <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    <div className="relative pl-5 space-y-2">
                      {/* Vertical line */}
                      <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      {comms.map((comm) => {
                        const Icon = getCommunicationIcon(comm.communication_type);
                        const iconColor = getCommunicationColor(comm.communication_type);
                        const responseColor = getResponseBadgeColor(comm.customer_response);
                        
                        return (
                          <div key={comm.id} className="relative flex items-start gap-2">
                            {/* Timeline dot */}
                            <div className={`absolute left-0 w-4 h-4 rounded-full ${iconColor} border-2 border-white shadow-sm flex items-center justify-center z-10`}>
                              <Icon className="w-2 h-2" />
                            </div>
                            
                            {/* Content card */}
                            <Card className="flex-1 border-gray-200 hover:shadow-sm transition-shadow bg-white ml-5">
                              <CardContent className="p-2.5">
                                <div className="flex items-start justify-between mb-1 gap-2">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${iconColor}`}>
                                      {comm.communication_type.replace('_', ' ')}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 border-gray-200">
                                      {comm.direction}
                                    </Badge>
                                    {comm.customer_response && (
                                      <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${responseColor}`}>
                                        {comm.customer_response.replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatDate(comm.sent_at || comm.received_at || comm.created_at)}
                                  </span>
                                </div>
                                
                                {comm.subject && (
                                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{comm.subject}</h4>
                                )}
                                
                                {comm.content && (
                                  <p className="text-xs text-gray-700 mb-1 whitespace-pre-wrap line-clamp-2">{comm.content}</p>
                                )}
                                
                                {comm.response_notes && (
                                  <div className="mt-1 p-1.5 bg-gray-50 rounded border border-gray-200">
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
          </div>
          
          {/* Footer with Add Communication button */}
          <div className="border-t border-gray-200 px-4 py-3 bg-white">
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              size="sm"
            >
              <FiMail className="w-4 h-4 mr-2" />
              Add Communication
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Communication Form Modal */}
      {showAddForm && (
        <AddCommunicationForm
          leadId={leadId}
          open={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSuccess={handleCommunicationAdded}
        />
      )}
    </>
  );
}

