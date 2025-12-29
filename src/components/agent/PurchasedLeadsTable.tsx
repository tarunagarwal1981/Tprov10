'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  FiMoreVertical,
  FiEye,
  FiPhone,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiChevronDown,
  FiChevronRight,
  FiMail,
} from 'react-icons/fi';
import { FaPlane, FaHiking, FaUmbrellaBeach, FaPaw, FaGem, FaMoneyBillWave, FaUsers, FaHeart } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';
import { LeadCommunicationHistory } from '@/components/agent/LeadCommunicationHistory';
import { AddCommunicationForm } from '@/components/agent/AddCommunicationForm';
import type { LeadPurchase } from '@/lib/types/marketplace';
import { TripType } from '@/lib/types/marketplace';

interface PurchasedLeadsTableProps {
  purchases: LeadPurchase[];
  loading: boolean;
  onCreateProposal: (leadId: string) => void;
}

// Trip type icon mapping
const getTripTypeIcon = (tripType: TripType) => {
  const icons = {
    [TripType.ADVENTURE]: FaHiking,
    [TripType.CULTURAL]: FaPlane,
    [TripType.BEACH]: FaUmbrellaBeach,
    [TripType.WILDLIFE]: FaPaw,
    [TripType.LUXURY]: FaGem,
    [TripType.BUDGET]: FaMoneyBillWave,
    [TripType.FAMILY]: FaUsers,
    [TripType.HONEYMOON]: FaHeart,
  };
  return icons[tripType] || FaPlane;
};

// Trip type badge color mapping
const getTripTypeBadgeColor = (tripType: TripType) => {
  const colors = {
    [TripType.ADVENTURE]: 'bg-orange-100 text-orange-700 border-orange-200',
    [TripType.CULTURAL]: 'bg-purple-100 text-purple-700 border-purple-200',
    [TripType.BEACH]: 'bg-blue-100 text-blue-700 border-blue-200',
    [TripType.WILDLIFE]: 'bg-green-100 text-green-700 border-green-200',
    [TripType.LUXURY]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    [TripType.BUDGET]: 'bg-gray-100 text-gray-700 border-gray-200',
    [TripType.FAMILY]: 'bg-pink-100 text-pink-700 border-pink-200',
    [TripType.HONEYMOON]: 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[tripType] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

  const formatDate = (date: Date | string) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

  const ensureLeadExists = async (marketplaceLeadId: string): Promise<string | null> => {
    // Return cached lead ID if available
    if (leadIdMap[marketplaceLeadId]) {
      return leadIdMap[marketplaceLeadId];
    }

    // If already loading, return null
    if (loadingLeadIds.has(marketplaceLeadId)) {
      return null;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return null;
    }

    setLoadingLeadIds(prev => new Set(prev).add(marketplaceLeadId));

    try {
      const accessToken = getAccessToken();
      const response = await fetch('/api/leads/ensure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          leadId: marketplaceLeadId,
          agentId: user.id,
        }),
      });

      if (response.ok) {
        const { leadId } = await response.json();
        setLeadIdMap(prev => ({ ...prev, [marketplaceLeadId]: leadId }));
        return leadId;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to load lead information');
        return null;
      }
    } catch (error) {
      console.error('Error ensuring lead:', error);
      toast.error('Failed to load lead information');
      return null;
    } finally {
      setLoadingLeadIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(marketplaceLeadId);
        return newSet;
      });
    }
  };

  const toggleRow = async (purchaseId: string, marketplaceLeadId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(purchaseId)) {
      newExpanded.delete(purchaseId);
    } else {
      newExpanded.add(purchaseId);
      // Ensure lead exists when expanding
      await ensureLeadExists(marketplaceLeadId);
    }
    setExpandedRows(newExpanded);
  };

  const handleAddCommunication = async (marketplaceLeadId: string) => {
    const leadId = await ensureLeadExists(marketplaceLeadId);
    if (leadId) {
      setSelectedLeadForCommunication(leadId);
      setCommunicationModalOpen(true);
    } else {
      toast.error('Please wait for lead information to load');
    }
  };

export function PurchasedLeadsTable({ purchases, loading, onCreateProposal }: PurchasedLeadsTableProps) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [leadIdMap, setLeadIdMap] = useState<Record<string, string>>({});
  const [loadingLeadIds, setLoadingLeadIds] = useState<Set<string>>(new Set());
  const [quickActionMenu, setQuickActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [selectedLeadForCommunication, setSelectedLeadForCommunication] = useState<string | null>(null);

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

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No purchased leads found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-12">
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Lead
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Trip Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Budget Range
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Duration / Travelers
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Purchased Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Purchase Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchases.map((purchase) => {
              const lead = purchase.lead;
              if (!lead) return null;

              const TripIcon = getTripTypeIcon(lead.tripType);
              const tripBadgeColor = getTripTypeBadgeColor(lead.tripType);

              const isExpanded = expandedRows.has(purchase.id);
              const leadIdFromLeadsTable = leadIdMap[lead.id];
              const isLoadingLeadId = loadingLeadIds.has(lead.id);

              return (
                <React.Fragment key={purchase.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRow(purchase.id, lead.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {isExpanded ? (
                          <FiChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <FiChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.customerName || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <FiMapPin className="w-3 h-3" />
                          <span>{lead.destination}</span>
                        </div>
                      </div>
                    </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge className={`${tripBadgeColor} flex items-center gap-1.5 w-fit`}>
                      <TripIcon className="w-3 h-3" />
                      <span>{lead.tripType.replace('_', ' ')}</span>
                    </Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(lead.budgetMin)} - {formatCurrency(lead.budgetMax)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3 text-gray-400" />
                        <span>{lead.durationDays} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiUser className="w-3 h-3 text-gray-400" />
                        <span>{lead.travelersCount} travelers</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(purchase.purchasedAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(purchase.purchasePrice)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          const button = e.currentTarget;
                          const rect = button.getBoundingClientRect();
                          if (quickActionMenu === purchase.id) {
                            setQuickActionMenu(null);
                            setMenuPosition(null);
                          } else {
                            setQuickActionMenu(purchase.id);
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
                    <td colSpan={8} className="px-3 py-3 bg-gray-50">
                      <div className="space-y-3">
                        {/* Communication History */}
                        <Card>
                          <CardContent className="p-2">
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">
                              Communication History
                            </h4>
                            {isLoadingLeadId ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              </div>
                            ) : leadIdFromLeadsTable ? (
                              <LeadCommunicationHistory leadId={leadIdFromLeadsTable} />
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-xs text-gray-500">Loading lead information...</p>
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

      {/* Actions Menu */}
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
                {purchases.find(p => p.id === quickActionMenu)?.lead && (
                  <>
                    <button
                      onClick={async () => {
                        const purchase = purchases.find(p => p.id === quickActionMenu);
                        if (purchase?.lead) {
                          await handleAddCommunication(purchase.lead.id);
                        }
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
                        const purchase = purchases.find(p => p.id === quickActionMenu);
                        if (purchase?.lead) {
                          onCreateProposal(purchase.lead.id);
                        }
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
                        const purchase = purchases.find(p => p.id === quickActionMenu);
                        if (purchase?.lead) {
                          router.push(`/agent/leads/${purchase.lead.id}`);
                        }
                        setQuickActionMenu(null);
                        setMenuPosition(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FiEye className="w-4 h-4" />
                      View Full Details
                    </button>
                    {purchases.find(p => p.id === quickActionMenu)?.lead?.customerPhone && (
                      <button
                        onClick={() => {
                          const purchase = purchases.find(p => p.id === quickActionMenu);
                          if (purchase?.lead?.customerPhone) {
                            window.location.href = `tel:${purchase.lead.customerPhone}`;
                          }
                          setQuickActionMenu(null);
                          setMenuPosition(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FiPhone className="w-4 h-4" />
                        Call
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {/* Add Communication Modal */}
      {selectedLeadForCommunication && (
        <AddCommunicationForm
          leadId={selectedLeadForCommunication}
          open={communicationModalOpen}
          onClose={() => {
            setCommunicationModalOpen(false);
            setSelectedLeadForCommunication(null);
          }}
          onSuccess={() => {
            // Communication added successfully - the LeadCommunicationHistory component will refresh automatically
            setCommunicationModalOpen(false);
            setSelectedLeadForCommunication(null);
          }}
        />
      )}
    </div>
  );
}

