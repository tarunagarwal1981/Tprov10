'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiChevronDown,
  FiChevronRight,
  FiMoreVertical,
  FiEye,
  FiPackage,
  FiMail,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiCheck,
  FiFileText,
  FiLock,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiPlus,
} from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/CognitoAuthContext';
import { getAccessToken } from '@/lib/auth/getAccessToken';
import { QueryModal } from '@/components/agent/QueryModal';
import { AddCommunicationForm } from '@/components/agent/AddCommunicationForm';
import { AssignLeadToSubAgent } from '@/components/agent/AssignLeadToSubAgent';
import { LeadCommunicationHistory } from '@/components/agent/LeadCommunicationHistory';
import { PaymentTrackingPanel } from '@/components/agent/PaymentTrackingPanel';
import { GenerateInvoiceModal } from '@/components/agent/GenerateInvoiceModal';
import { ConfirmPaymentModal } from '@/components/agent/ConfirmPaymentModal';
import { LeadStageSelector } from '@/components/agent/LeadStageSelector';
import { LeadPrioritySelector } from '@/components/agent/LeadPrioritySelector';
import { FollowUpDatePicker } from '@/components/agent/FollowUpDatePicker';
import { StageBadge, PriorityBadge, OverdueBadge } from '@/components/agent/LeadStatusBadges';
import { LeadStage, LeadPriority, getLeadStageLabel, getLeadPriorityLabel } from '@/lib/types/agent';

interface LeadWithAggregates {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  destination: string;
  stage: string;
  priority: string;
  next_follow_up_date: string | null;
  last_contacted_at: string | null;
  created_at: string;
  itinerary_count: number;
  total_value: number;
  total_paid: number;
  last_communication_at: string | null;
  last_communication_type: string | null;
  assigned_to: string | null;
}

interface Itinerary {
  id: string;
  name: string;
  status: string;
  total_price: number | null;
  is_locked: boolean;
  customer_id: string | null;
}

interface LeadsManagementTableProps {
  leads: LeadWithAggregates[];
  loading: boolean;
  onRefresh: () => void;
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

const getPriorityBadgeColor = (priority: string) => {
  const priorityMap: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-700 border-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    URGENT: 'bg-red-100 text-red-700 border-red-200',
  };
  return priorityMap[priority] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const isOverdue = (dateString: string | null) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};

export function LeadsManagementTable({ leads, loading, onRefresh }: LeadsManagementTableProps) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [quickActionMenu, setQuickActionMenu] = useState<string | null>(null);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [queryAction, setQueryAction] = useState<'create' | 'insert' | null>(null);
  const [selectedLeadForQuery, setSelectedLeadForQuery] = useState<string | null>(null);
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [selectedLeadForCommunication, setSelectedLeadForCommunication] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<string | null>(null);
  const [itineraries, setItineraries] = useState<Record<string, Itinerary[]>>({});
  const [loadingItineraries, setLoadingItineraries] = useState<Set<string>>(new Set());
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedItineraryForInvoice, setSelectedItineraryForInvoice] = useState<{ id: string; totalPrice: number } | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedItineraryForPayment, setSelectedItineraryForPayment] = useState<{ id: string; totalPrice: number } | null>(null);
  const [confirmingItineraryId, setConfirmingItineraryId] = useState<string | null>(null);

  const toggleRow = (leadId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
      // Fetch itineraries when expanding
      if (!itineraries[leadId]) {
        fetchItineraries(leadId);
      }
    }
    setExpandedRows(newExpanded);
  };

  const fetchItineraries = async (leadId: string) => {
    if (loadingItineraries.has(leadId)) return;
    
    setLoadingItineraries(prev => new Set(prev).add(leadId));
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/itineraries/leads/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });
      if (response.ok) {
        const { itineraries: itinerariesData } = await response.json();
        setItineraries(prev => ({ ...prev, [leadId]: itinerariesData || [] }));
      }
    } catch (error) {
      console.error('Error fetching itineraries:', error);
    } finally {
      setLoadingItineraries(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
    }
  };

  const handleQuerySave = async (data: {
    destinations: Array<{ city: string; nights: number }>;
    leaving_from: string;
    nationality: string;
    leaving_on: string;
    travelers: { rooms: number; adults: number; children: number; infants: number };
    star_rating?: number;
    add_transfers: boolean;
  }) => {
    if (!selectedLeadForQuery || !user?.id) return;

    try {
      // Create query
      const queryResponse = await fetch(`/api/queries/${selectedLeadForQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinations: data.destinations,
          leaving_from: data.leaving_from,
          nationality: data.nationality,
          leaving_on: data.leaving_on,
          travelers: data.travelers,
          star_rating: data.star_rating,
          add_transfers: data.add_transfers,
        }),
      });

      if (!queryResponse.ok) {
        const error = await queryResponse.json();
        throw new Error(error.error || 'Failed to create query');
      }

      const { query: savedQuery } = await queryResponse.json();

      // Create itinerary
      const itineraryPayload = {
        leadId: selectedLeadForQuery,
        agentId: user.id,
        name: queryAction === 'insert' ? 'Insert Itinerary' : 'Create Itinerary',
        adultsCount: data.travelers.adults,
        childrenCount: data.travelers.children,
        infantsCount: data.travelers.infants,
        queryId: savedQuery.id,
      };

      const itineraryResponse = await fetch('/api/itineraries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itineraryPayload),
      });

      if (!itineraryResponse.ok) {
        const error = await itineraryResponse.json();
        throw new Error(error.error || 'Failed to create itinerary');
      }

      const { itinerary: createdItinerary } = await itineraryResponse.json();

      // Navigate based on action
      if (queryAction === 'create') {
        router.push(`/agent/leads/${selectedLeadForQuery}/itineraries/new?queryId=${savedQuery.id}&itineraryId=${createdItinerary.id}`);
      } else {
        router.push(`/agent/leads/${selectedLeadForQuery}/insert?itineraryId=${createdItinerary.id}&queryId=${savedQuery.id}`);
      }
    } catch (error) {
      console.error('Error creating query/itinerary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create itinerary');
    }
  };

  const handleGenerateInvoice = (itinerary: Itinerary) => {
    setSelectedItineraryForInvoice({
      id: itinerary.id,
      totalPrice: itinerary.total_price ?? 0,
    });
    setInvoiceModalOpen(true);
  };

  const handleConfirmItinerary = async (itineraryId: string) => {
    if (confirmingItineraryId === itineraryId) return;
    
    setConfirmingItineraryId(itineraryId);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/itineraries/${itineraryId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({ lock: true }),
      });

      if (response.ok) {
        toast.success('Itinerary confirmed and locked successfully');
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to confirm itinerary');
      }
    } catch (error) {
      console.error('Error confirming itinerary:', error);
      toast.error('Failed to confirm itinerary');
    } finally {
      setConfirmingItineraryId(null);
    }
  };

  const handleConfirmPayment = (itinerary: Itinerary) => {
    setSelectedItineraryForPayment({
      id: itinerary.id,
      totalPrice: itinerary.total_price ?? 0,
    });
    setPaymentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Lead
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Itineraries
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Total Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Total Paid
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Last Communication
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Follow-up
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => {
              const isExpanded = expandedRows.has(lead.id);
              const leadItineraries = itineraries[lead.id] || [];
              const isLoadingItineraries = loadingItineraries.has(lead.id);
              const isOverdueFollowUp = isOverdue(lead.next_follow_up_date);

              return (
                <React.Fragment key={lead.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRow(lead.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {isExpanded ? (
                            <FiChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <FiChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.customer_name}</div>
                          <div className="text-xs text-gray-500">{lead.destination}</div>
                          {lead.customer_id && (
                            <div className="text-xs text-gray-400 font-mono mt-1">{lead.customer_id}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StageBadge stage={lead.stage} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <PriorityBadge priority={lead.priority} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.itinerary_count}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(lead.total_value)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(lead.total_paid)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.last_communication_at ? (
                        <div>
                          <div>{formatDate(lead.last_communication_at)}</div>
                          {lead.last_communication_type && (
                            <div className="text-xs text-gray-400 capitalize">
                              {lead.last_communication_type.replace('_', ' ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        'No communication'
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {lead.next_follow_up_date ? (
                        <div className="flex items-center gap-2">
                          <span className={isOverdueFollowUp ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                            {formatDate(lead.next_follow_up_date)}
                          </span>
                          <OverdueBadge date={lead.next_follow_up_date} />
                        </div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuickActionMenu(quickActionMenu === lead.id ? null : lead.id)}
                          className="h-8 w-8 p-0"
                        >
                          <FiMoreVertical className="w-4 h-4" />
                        </Button>
                        {quickActionMenu === lead.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedLeadForQuery(lead.id);
                                  setQueryAction('create');
                                  setQueryModalOpen(true);
                                  setQuickActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <FiPackage className="w-4 h-4" />
                                Create Itinerary
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLeadForQuery(lead.id);
                                  setQueryAction('insert');
                                  setQueryModalOpen(true);
                                  setQuickActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <FiPackage className="w-4 h-4" />
                                Insert Itinerary
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLeadForCommunication(lead.id);
                                  setCommunicationModalOpen(true);
                                  setQuickActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <FiMail className="w-4 h-4" />
                                Add Communication
                              </button>
                              <button
                                onClick={() => {
                                  router.push(`/agent/leads/${lead.id}`);
                                  setQuickActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <FiEye className="w-4 h-4" />
                                View Full Details
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 bg-gray-50">
                        <div className="space-y-6">
                          {/* Stage, Priority, and Follow-up Management */}
                          <Card>
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-4">Lead Management</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Stage</label>
                                  <LeadStageSelector
                                    leadId={lead.id}
                                    currentStage={lead.stage}
                                    onUpdate={onRefresh}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                                  <LeadPrioritySelector
                                    leadId={lead.id}
                                    currentPriority={lead.priority}
                                    onUpdate={onRefresh}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Follow-up Date</label>
                                  <FollowUpDatePicker
                                    leadId={lead.id}
                                    currentDate={lead.next_follow_up_date}
                                    onUpdate={onRefresh}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Communications Timeline */}
                          <Card>
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-4">Communication History</h4>
                              <LeadCommunicationHistory leadId={lead.id} />
                            </CardContent>
                          </Card>

                          {/* Itineraries List */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-900">Itineraries</h4>
                                {isLoadingItineraries && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
                              </div>
                              {leadItineraries.length === 0 ? (
                                <p className="text-sm text-gray-500">No itineraries yet</p>
                              ) : (
                                <div className="space-y-3">
                                  {leadItineraries.map((itinerary) => (
                                    <div
                                      key={itinerary.id}
                                      className="border border-gray-200 rounded-lg p-3 bg-white"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900">{itinerary.name}</span>
                                          <Badge variant="secondary">{itinerary.status}</Badge>
                                          {itinerary.is_locked && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                              <FiLock className="w-3 h-3 mr-1" />
                                              Locked
                                            </Badge>
                                          )}
                                          {itinerary.customer_id && (
                                            <span className="text-xs text-gray-500 font-mono">
                                              {itinerary.customer_id}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-sm font-semibold text-green-600">
                                          {formatCurrency(itinerary.total_price ?? 0)}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleGenerateInvoice(itinerary)}
                                          disabled={itinerary.is_locked || (itinerary.total_price ?? 0) <= 0}
                                          className="text-xs"
                                        >
                                          <FiFileText className="w-3 h-3 mr-1" />
                                          Generate Invoice
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleConfirmItinerary(itinerary.id)}
                                          disabled={itinerary.is_locked || confirmingItineraryId === itinerary.id}
                                          className="text-xs"
                                        >
                                          <FiCheck className="w-3 h-3 mr-1" />
                                          Confirm
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleConfirmPayment(itinerary)}
                                          disabled={itinerary.is_locked}
                                          className="text-xs"
                                        >
                                          <FiDollarSign className="w-3 h-3 mr-1" />
                                          Confirm Payment
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => router.push(`/agent/leads/${lead.id}/itineraries/new?itineraryId=${itinerary.id}`)}
                                          className="text-xs"
                                        >
                                          <FiEye className="w-3 h-3 mr-1" />
                                          View Days
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedLeadForQuery && (
        <QueryModal
          isOpen={queryModalOpen}
          onClose={() => {
            setQueryModalOpen(false);
            setSelectedLeadForQuery(null);
            setQueryAction(null);
          }}
          onSave={handleQuerySave}
          leadId={selectedLeadForQuery}
          loading={false}
        />
      )}

      {selectedLeadForCommunication && (
        <AddCommunicationForm
          leadId={selectedLeadForCommunication}
          open={communicationModalOpen}
          onClose={() => {
            setCommunicationModalOpen(false);
            setSelectedLeadForCommunication(null);
          }}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}

      {selectedLeadForAssign && (
        <AssignLeadToSubAgent
          leadId={selectedLeadForAssign}
          open={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedLeadForAssign(null);
          }}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}

      {selectedItineraryForInvoice && (
        <GenerateInvoiceModal
          itineraryId={selectedItineraryForInvoice.id}
          totalPrice={selectedItineraryForInvoice.totalPrice}
          open={invoiceModalOpen}
          onClose={() => {
            setInvoiceModalOpen(false);
            setSelectedItineraryForInvoice(null);
          }}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}

      {selectedItineraryForPayment && (
        <ConfirmPaymentModal
          itineraryId={selectedItineraryForPayment.id}
          totalPrice={selectedItineraryForPayment.totalPrice}
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedItineraryForPayment(null);
          }}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}

      {/* Click outside to close menu */}
      {quickActionMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setQuickActionMenu(null)}
        />
      )}
    </div>
  );
}

