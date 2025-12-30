'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [selectedLeadForCommunication, setSelectedLeadForCommunication] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<string | null>(null);
  const [itineraries, setItineraries] = useState<Record<string, Itinerary[]>>({});
  const [loadingItineraries, setLoadingItineraries] = useState<Set<string>>(new Set());
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedItineraryForInvoice, setSelectedItineraryForInvoice] = useState<{ 
    id: string;
    leadId: string;
    totalPrice: number;
    itineraryItems?: Array<{
      id: string;
      package_title: string;
      total_price: number | null;
      unit_price: number | null;
      quantity: number;
    }>;
  } | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedItineraryForPayment, setSelectedItineraryForPayment] = useState<{ id: string; totalPrice: number } | null>(null);
  const [confirmingItineraryId, setConfirmingItineraryId] = useState<string | null>(null);

  const toggleRow = (leadId: string) => {
    console.log('[LeadsManagementTable] ===== toggleRow START =====');
    console.log('[LeadsManagementTable] toggleRow: leadId:', leadId);
    console.log('[LeadsManagementTable] toggleRow: leadId type:', typeof leadId);
    console.log('[LeadsManagementTable] toggleRow: leadId length:', leadId?.length);
    console.log('[LeadsManagementTable] toggleRow: Currently expanded?', expandedRows.has(leadId));
    console.log('[LeadsManagementTable] toggleRow: Has itineraries cached?', !!itineraries[leadId]);
    console.log('[LeadsManagementTable] toggleRow: Cached itineraries count:', itineraries[leadId]?.length || 0);
    
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(leadId)) {
      console.log('[LeadsManagementTable] toggleRow: Collapsing row for leadId:', leadId);
      newExpanded.delete(leadId);
    } else {
      console.log('[LeadsManagementTable] toggleRow: Expanding row for leadId:', leadId);
      newExpanded.add(leadId);
      // Fetch itineraries when expanding
      if (!itineraries[leadId]) {
        console.log('[LeadsManagementTable] toggleRow: No cached itineraries, calling fetchItineraries...');
        fetchItineraries(leadId);
      } else {
        console.log('[LeadsManagementTable] toggleRow: Using cached itineraries:', itineraries[leadId].length);
      }
    }
    setExpandedRows(newExpanded);
    console.log('[LeadsManagementTable] ===== toggleRow END =====');
  };

  const fetchItineraries = async (leadId: string) => {
    console.log('[LeadsManagementTable] ===== fetchItineraries START =====');
    console.log('[LeadsManagementTable] fetchItineraries: leadId:', leadId);
    console.log('[LeadsManagementTable] fetchItineraries: Already loading?', loadingItineraries.has(leadId));
    
    if (loadingItineraries.has(leadId)) {
      console.log('[LeadsManagementTable] fetchItineraries: Already loading, skipping');
      return;
    }
    
    setLoadingItineraries(prev => new Set(prev).add(leadId));
    try {
      const accessToken = getAccessToken();
      const apiUrl = `/api/itineraries/leads/${leadId}`;
      console.log('[LeadsManagementTable] fetchItineraries: API URL:', apiUrl);
      console.log('[LeadsManagementTable] fetchItineraries: Making fetch request...');
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });
      
      console.log('[LeadsManagementTable] fetchItineraries: Response status:', response.status);
      console.log('[LeadsManagementTable] fetchItineraries: Response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[LeadsManagementTable] fetchItineraries: Response data:', result);
        const itinerariesData = result.itineraries || [];
        console.log('[LeadsManagementTable] fetchItineraries: Extracted itineraries:', itinerariesData.length);
        console.log('[LeadsManagementTable] fetchItineraries: Itineraries data:', JSON.stringify(itinerariesData, null, 2));
        setItineraries(prev => {
          const updated = { ...prev, [leadId]: itinerariesData };
          console.log('[LeadsManagementTable] fetchItineraries: Updated state for leadId:', leadId, 'with', itinerariesData.length, 'itineraries');
          return updated;
        });
      } else {
        const errorText = await response.text();
        console.error('[LeadsManagementTable] fetchItineraries: Response not OK:', response.status, errorText);
      }
    } catch (error) {
      console.error('[LeadsManagementTable] fetchItineraries: EXCEPTION:', error);
      console.error('[LeadsManagementTable] fetchItineraries: Error details:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingItineraries(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
      console.log('[LeadsManagementTable] ===== fetchItineraries END =====');
    }
  };


  const handleGenerateInvoice = async (itinerary: Itinerary, leadId: string) => {
    // Fetch itinerary items for pre-filling line items
    let itineraryItems: Array<{
      id: string;
      package_title: string;
      total_price: number | null;
      unit_price: number | null;
      quantity: number;
    }> = [];
    
    try {
      const accessToken = getAccessToken();
      const itemsResponse = await fetch(`/api/itineraries/${itinerary.id}/items`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });
      if (itemsResponse.ok) {
        const { items } = await itemsResponse.json();
        itineraryItems = items || [];
      }
    } catch (error) {
      console.error('Error fetching itinerary items:', error);
    }
    
    setSelectedItineraryForInvoice({
      id: itinerary.id,
      leadId,
      totalPrice: itinerary.total_price ?? 0,
      itineraryItems,
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
              
              // Debug logging
              if (expandedRows.has(lead.id)) {
                console.log('[LeadsManagementTable] Render: Expanded row for leadId:', lead.id);
                console.log('[LeadsManagementTable] Render: leadItineraries.length:', leadItineraries.length);
                console.log('[LeadsManagementTable] Render: lead.itinerary_count:', lead.itinerary_count);
                console.log('[LeadsManagementTable] Render: isLoadingItineraries:', isLoadingItineraries);
              }
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
                          onClick={(e) => {
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();
                            if (quickActionMenu === lead.id) {
                              setQuickActionMenu(null);
                              setMenuPosition(null);
                            } else {
                              setQuickActionMenu(lead.id);
                              setMenuPosition({
                                top: rect.bottom + window.scrollY + 4,
                                left: rect.right + window.scrollX - 192, // 192 = w-48 (12rem)
                              });
                            }
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <FiMoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="px-3 py-3 bg-gray-50">
                        <div className="space-y-3">
                          {/* Stage, Priority, and Follow-up Management */}
                          <Card>
                            <CardContent className="p-2">
                              <h4 className="font-semibold text-sm text-gray-900 mb-2">Lead Management</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[10px] text-gray-500 mb-0.5 block font-medium">Stage</label>
                                  <LeadStageSelector
                                    leadId={lead.id}
                                    currentStage={lead.stage || 'NEW'}
                                    onUpdate={onRefresh}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 mb-0.5 block font-medium">Priority</label>
                                  <LeadPrioritySelector
                                    leadId={lead.id}
                                    currentPriority={lead.priority || 'MEDIUM'}
                                    onUpdate={onRefresh}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 mb-0.5 block font-medium">Follow-up Date</label>
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
                            <CardContent className="p-2">
                              <h4 className="font-semibold text-sm text-gray-900 mb-2">Communication History</h4>
                              <LeadCommunicationHistory leadId={lead.id} />
                            </CardContent>
                          </Card>

                          {/* Itineraries List */}
                          <Card>
                            <CardContent className="p-2">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm text-gray-900">Itineraries</h4>
                                {process.env.NODE_ENV === 'development' && (
                                  <span className="text-xs text-gray-400">
                                    ({leadItineraries.length} shown, {lead.itinerary_count} in DB, loading: {isLoadingItineraries ? 'yes' : 'no'})
                                  </span>
                                )}
                              </div>
                              {(() => {
                                console.log('[LeadsManagementTable] Render Itineraries Section:');
                                console.log('[LeadsManagementTable] - leadId:', lead.id);
                                console.log('[LeadsManagementTable] - leadItineraries.length:', leadItineraries.length);
                                console.log('[LeadsManagementTable] - lead.itinerary_count:', lead.itinerary_count);
                                console.log('[LeadsManagementTable] - isLoadingItineraries:', isLoadingItineraries);
                                console.log('[LeadsManagementTable] - leadItineraries:', JSON.stringify(leadItineraries, null, 2));
                                return null;
                              })()}
                              {isLoadingItineraries && (
                                <div className="flex items-center justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                              )}
                              {!isLoadingItineraries && leadItineraries.length === 0 && (
                                <div className="text-center py-4">
                                  <p className="text-xs text-gray-500">No itineraries found</p>
                                  {lead.itinerary_count > 0 && (
                                    <p className="text-xs text-orange-500 mt-1">
                                      Warning: Database shows {lead.itinerary_count} itineraries but none were fetched. Check console logs.
                                    </p>
                                  )}
                                </div>
                              )}
                              {!isLoadingItineraries && leadItineraries.length > 0 && (
                                <div className="space-y-2">
                                  {leadItineraries.map((itinerary) => {
                                    console.log('[LeadsManagementTable] Rendering itinerary card:', itinerary.id, itinerary.name);
                                    return (
                                    <div
                                      key={itinerary.id}
                                      className="border border-gray-200 rounded-lg p-2 bg-white"
                                    >
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-medium text-sm text-gray-900">{itinerary.name}</span>
                                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">{itinerary.status}</Badge>
                                          {itinerary.is_locked && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0.5">
                                              <FiLock className="w-2.5 h-2.5 mr-0.5" />
                                              Locked
                                            </Badge>
                                          )}
                                          {itinerary.customer_id && (
                                            <span className="text-[10px] text-gray-500 font-mono">
                                              {itinerary.customer_id}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs font-semibold text-green-600">
                                          {formatCurrency(itinerary.total_price ?? 0)}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleGenerateInvoice(itinerary, lead.id)}
                                          disabled={itinerary.is_locked || (itinerary.total_price ?? 0) <= 0}
                                          className="text-[10px] h-7 px-2 py-1"
                                        >
                                          <FiFileText className="w-2.5 h-2.5 mr-1" />
                                          Invoice
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleConfirmItinerary(itinerary.id)}
                                          disabled={itinerary.is_locked || confirmingItineraryId === itinerary.id}
                                          className="text-[10px] h-7 px-2 py-1"
                                        >
                                          <FiCheck className="w-2.5 h-2.5 mr-1" />
                                          Confirm
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleConfirmPayment(itinerary)}
                                          disabled={itinerary.is_locked}
                                          className="text-[10px] h-7 px-2 py-1"
                                        >
                                          <FiDollarSign className="w-2.5 h-2.5 mr-1" />
                                          Payment
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => router.push(`/agent/leads/${lead.id}/itineraries/new?itineraryId=${itinerary.id}`)}
                                          className="text-[10px] h-7 px-2 py-1"
                                        >
                                          <FiEye className="w-2.5 h-2.5 mr-1" />
                                          View
                                        </Button>
                                      </div>
                                    </div>
                                    );
                                  })}
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
          leadId={selectedItineraryForInvoice.leadId}
          totalPrice={selectedItineraryForInvoice.totalPrice}
          open={invoiceModalOpen}
          onClose={() => {
            setInvoiceModalOpen(false);
            setSelectedItineraryForInvoice(null);
          }}
          onSuccess={() => {
            onRefresh();
          }}
          leadCustomerInfo={undefined}
          itineraryItems={selectedItineraryForInvoice.itineraryItems}
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
        <>
        <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setQuickActionMenu(null);
              setMenuPosition(null);
            }}
          />
          {menuPosition && typeof window !== 'undefined' && createPortal(
            <div
              className="fixed w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    const leadId = quickActionMenu;
                    router.push(`/agent/leads/${leadId}/proposals/new`);
                    setQuickActionMenu(null);
                    setMenuPosition(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FiFileText className="w-4 h-4" />
                  Create Proposal
                </button>
                <button
                  onClick={() => {
                    const leadId = quickActionMenu;
                    setSelectedLeadForCommunication(leadId);
                    setCommunicationModalOpen(true);
                    setQuickActionMenu(null);
                    setMenuPosition(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FiMail className="w-4 h-4" />
                  Add Communication
                </button>
                <button
                  onClick={() => {
                    const leadId = quickActionMenu;
                    router.push(`/agent/leads/${leadId}`);
                    setQuickActionMenu(null);
                    setMenuPosition(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FiEye className="w-4 h-4" />
                  View Full Details
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}

