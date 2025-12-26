'use client';

import React, { useState, useEffect } from 'react';
import { FiUsers, FiPackage, FiTrendingUp, FiMail, FiPhone } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';
import { useRouter } from 'next/navigation';

interface Lead {
  id: string;
  destination: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
}

export default function SalesDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchLeads();
    }
  }, [user?.id]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // Fetch all leads (sales can see all leads)
      const accessToken = getAccessToken();
      const response = await fetch(`/api/marketplace/purchased?agentId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });
      if (response.ok) {
        const { purchases } = await response.json();
        // Map purchases to leads
        const leadsData = purchases.map((p: any) => ({
          id: p.leadId || p.lead?.id,
          destination: p.lead?.destination || 'Unknown',
          customerName: p.lead?.customerName,
          customerEmail: p.lead?.customerEmail,
          customerPhone: p.lead?.customerPhone,
          status: 'active',
        }));
        setLeads(leadsData || []);
      } else {
        toast.error('Failed to fetch leads');
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const activeLeads = leads.length;
  const contactedLeads = leads.filter(l => l.status === 'contacted').length;
  const conversionRate = activeLeads > 0 ? ((contactedLeads / activeLeads) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage leads, proposals, and customer communications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Leads</p>
                <p className="text-2xl font-bold text-gray-900">{activeLeads}</p>
              </div>
              <FiUsers className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Contacted</p>
                <p className="text-2xl font-bold text-green-600">{contactedLeads}</p>
              </div>
              <FiMail className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{conversionRate}%</p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Active Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active leads</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{lead.destination}</span>
                      {lead.customerName && (
                        <span className="text-sm text-gray-600">- {lead.customerName}</span>
                      )}
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {lead.customerEmail && (
                        <span className="flex items-center gap-1">
                          <FiMail className="w-3 h-3" />
                          {lead.customerEmail}
                        </span>
                      )}
                      {lead.customerPhone && (
                        <span className="flex items-center gap-1">
                          <FiPhone className="w-3 h-3" />
                          {lead.customerPhone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/agent/leads/${lead.id}`)}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

