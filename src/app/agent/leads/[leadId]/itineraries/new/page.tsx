'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUsers, FiCalendar, FiPackage } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgentDashboardLayout } from '@/components/dashboard/AgentDashboardLayout';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';

interface LeadDetails {
  id: string;
  destination: string;
  budget_min?: number;
  budget_max?: number;
  duration_days?: number;
  travelers_count?: number;
}

export default function CreateItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const supabase = createClient();

  const leadId = params.leadId as string;

  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: 'Itinerary #1',
    adultsCount: 2,
    childrenCount: 0,
    infantsCount: 0,
    startDate: '',
    endDate: '',
    notes: '',
  });

  // Fetch lead details
  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId || !user?.id) return;

      try {
        const { data, error } = await supabase
          .from('leads' as any)
          .select('id, destination, budget_min, budget_max, duration_days, travelers_count')
          .eq('id', leadId)
          .eq('agent_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          const leadData = data as LeadDetails;
          setLead(leadData);
          // Pre-fill form with lead data
          setFormData(prev => ({
            ...prev,
            adultsCount: leadData.travelers_count || 2,
            childrenCount: 0,
            infantsCount: 0,
          }));
        }
      } catch (err) {
        console.error('Error fetching lead:', err);
        toast.error('Failed to load lead details');
        router.push('/agent/leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [leadId, user?.id, router, toast, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !leadId) return;

    setCreating(true);

    try {
      // Create itinerary
      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries' as any)
        .insert({
          lead_id: leadId,
          agent_id: user.id,
          name: formData.name,
          adults_count: formData.adultsCount,
          children_count: formData.childrenCount,
          infants_count: formData.infantsCount,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          notes: formData.notes || null,
          lead_budget_min: lead?.budget_min || null,
          lead_budget_max: lead?.budget_max || null,
          status: 'draft',
        })
        .select()
        .single();

      if (itineraryError) throw itineraryError;

      if (itinerary) {
        toast.success('Itinerary created successfully!');
        router.push(`/agent/itineraries/${itinerary.id}/builder`);
      }
    } catch (err) {
      console.error('Error creating itinerary:', err);
      toast.error('Failed to create itinerary. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <AgentDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lead details...</p>
          </div>
        </div>
      </AgentDashboardLayout>
    );
  }

  if (!lead) {
    return (
      <AgentDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Lead not found</p>
            <Button onClick={() => router.push('/agent/leads')}>
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </div>
        </div>
      </AgentDashboardLayout>
    );
  }

  return (
    <AgentDashboardLayout>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/agent/leads')}
            className="mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Itinerary</h1>
          <p className="text-gray-600">
            Create a custom itinerary for <span className="font-semibold">{lead.destination}</span>
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-blue-600" />
                Itinerary Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Itinerary Name */}
              <div>
                <Label htmlFor="name">Itinerary Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Budget Option, Luxury Package"
                  required
                />
              </div>

              {/* Travelers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="adults" className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4" />
                    Adults
                  </Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    value={formData.adultsCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, adultsCount: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    value={formData.childrenCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, childrenCount: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Ages 3-12</p>
                </div>
                <div>
                  <Label htmlFor="infants">Infants</Label>
                  <Input
                    id="infants"
                    type="number"
                    min="0"
                    value={formData.infantsCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, infantsCount: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Under 3 years</p>
                </div>
              </div>

              {/* Travel Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    min={formData.startDate}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any special notes or requirements..."
                />
              </div>

              {/* Budget Info */}
              {lead.budget_min && lead.budget_max && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Lead Budget Range:</p>
                  <p className="text-lg font-bold text-blue-600">
                    ${lead.budget_min.toLocaleString()} - ${lead.budget_max.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    This will be used to compare against your itinerary total price
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/agent/leads')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  {creating ? 'Creating...' : 'Create & Continue'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AgentDashboardLayout>
  );
}

