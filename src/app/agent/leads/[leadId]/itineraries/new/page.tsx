'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUsers, FiCalendar, FiPackage, FiMapPin } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';
import { queryService } from '@/lib/services/queryService';

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
  const [query, setQuery] = useState<any>(null);
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

  // Fetch lead and query details
  useEffect(() => {
    const fetchData = async () => {
      if (!leadId || !user?.id) return;

      try {
        // Fetch query data first (required for Create Itinerary)
        const queryData = await queryService.getQueryByLeadId(leadId);
        
        if (!queryData || !queryData.destinations || queryData.destinations.length === 0) {
          toast.error('Please create a query with destinations first');
          router.push(`/agent/leads/${leadId}`);
          return;
        }

        setQuery(queryData);

        // Fetch lead details
        // First check if this is a purchased marketplace lead
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('lead_purchases' as any)
          .select('lead_id')
          .eq('lead_id', leadId)
          .eq('agent_id', user.id)
          .maybeSingle();

        if (purchaseError && purchaseError.code !== 'PGRST116') {
          throw purchaseError;
        }

        let leadData: LeadDetails | null = null;

        // If it's a purchased marketplace lead, fetch from lead_marketplace
        if (purchaseData) {
          const { data: marketplaceLeadRaw, error: marketplaceError } = await supabase
            .from('lead_marketplace' as any)
            .select('id, destination, budget_min, budget_max, duration_days, travelers_count')
            .eq('id', leadId)
            .single();

          if (marketplaceError) throw marketplaceError;
          const marketplaceLead = marketplaceLeadRaw as unknown as {
            id: string;
            destination: string;
            budget_min?: number | null;
            budget_max?: number | null;
            duration_days?: number | null;
            travelers_count?: number | null;
          } | null;

          if (marketplaceLead) {
            leadData = {
              id: marketplaceLead.id,
              destination: marketplaceLead.destination,
              budget_min: marketplaceLead.budget_min ?? undefined,
              budget_max: marketplaceLead.budget_max ?? undefined,
              duration_days: marketplaceLead.duration_days ?? undefined,
              travelers_count: marketplaceLead.travelers_count ?? undefined,
            };
          }
        } else {
          // Otherwise, try fetching from leads table
          const { data: regularLead, error: leadsError } = await supabase
          .from('leads' as any)
          .select('id, destination, budget_min, budget_max, duration_days, travelers_count')
          .eq('id', leadId)
          .eq('agent_id', user.id)
            .maybeSingle();

          if (leadsError && leadsError.code !== 'PGRST116') {
            throw leadsError;
          }

          if (regularLead) {
            leadData = regularLead as unknown as LeadDetails;
          }
        }

        if (!leadData) {
          throw new Error('Lead not found or you do not have access to it');
        }

        setLead(leadData);
        
        // Pre-fill form with query data
        const startDateValue = queryData.leaving_on 
          ? (new Date(queryData.leaving_on).toISOString().split('T')[0] || '')
          : '';
        setFormData(prev => ({
          ...prev,
          adultsCount: queryData.travelers?.adults || 2,
          childrenCount: queryData.travelers?.children || 0,
          infantsCount: queryData.travelers?.infants || 0,
          startDate: startDateValue,
        }));
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load data');
        router.push(`/agent/leads/${leadId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId, user?.id, router, toast, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !leadId || !lead || !query) return;

    setCreating(true);

    try {
      // First, ensure the lead exists in the leads table (for foreign key constraint)
      // Check if lead exists in leads table by marketplace_lead_id or by id
      let actualLeadId = leadId;
      
      const { data: existingLead, error: checkError } = await supabase
        .from('leads' as any)
        .select('id')
        .or(`id.eq.${leadId},marketplace_lead_id.eq.${leadId}`)
        .eq('agent_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // If lead doesn't exist in leads table, create it (for marketplace leads)
      if (!existingLead) {
        // Get purchase info and marketplace lead details with customer data
        const [purchaseResult, marketplaceLeadResult] = await Promise.all([
          supabase
            .from('lead_purchases' as any)
            .select('id')
            .eq('lead_id', leadId)
            .eq('agent_id', user.id)
            .maybeSingle(),
          supabase
            .from('lead_marketplace' as any)
            .select('customer_name, customer_email, customer_phone, special_requirements')
            .eq('id', leadId)
            .single(),
        ]);

        const purchase = (purchaseResult.data as unknown as { id: string } | null) || null;
        const marketplaceLead = marketplaceLeadResult.data as unknown as {
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          special_requirements?: string | null;
        } | null;

        // Create lead entry in leads table from marketplace lead data
        const { data: newLeadRaw, error: createLeadError } = await supabase
          .from('leads' as any)
          .insert({
            agent_id: user.id,
            destination: lead.destination,
            budget_min: lead.budget_min || null,
            budget_max: lead.budget_max || null,
            duration_days: lead.duration_days || null,
            travelers_count: lead.travelers_count || formData.adultsCount,
            marketplace_lead_id: leadId,
            purchased_from_marketplace: true,
            purchase_id: purchase?.id || null,
            is_purchased: true,
            source: 'MARKETPLACE',
            stage: 'NEW',
            priority: 'MEDIUM',
            customer_name: marketplaceLead?.customer_name || 'Customer',
            customer_email: marketplaceLead?.customer_email || 'customer@example.com',
            customer_phone: marketplaceLead?.customer_phone || null,
            requirements: marketplaceLead?.special_requirements || null,
          })
          .select('id')
          .single();

        if (createLeadError) throw createLeadError;
        const newLead = newLeadRaw as unknown as { id: string } | null;
        if (newLead) {
          actualLeadId = newLead.id;
        }
      } else {
        const typedExisting = existingLead as unknown as { id: string };
        actualLeadId = typedExisting.id;
      }

      // Calculate end date based on destinations and nights
      const totalNights = query.destinations.reduce((sum: number, dest: any) => sum + (dest.nights || 0), 0);
      const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalNights);

      // Create itinerary using the actual lead_id from leads table
      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries' as any)
        .insert({
          lead_id: actualLeadId,
          agent_id: user.id,
          name: formData.name,
          adults_count: formData.adultsCount,
          children_count: formData.childrenCount,
          infants_count: formData.infantsCount,
          start_date: formData.startDate || startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          notes: formData.notes || null,
          lead_budget_min: lead?.budget_min || null,
          lead_budget_max: lead?.budget_max || null,
          status: 'draft',
        })
        .select()
        .single();

      if (itineraryError) throw itineraryError;

      const itineraryData = itinerary as unknown as { id: string };
      const itineraryId = itineraryData.id;

      // Generate days based on query destinations
      const daysToInsert: any[] = [];
      const currentDate = new Date(startDate);
      let dayNumber = 1;

      for (const destination of query.destinations) {
        const cityName = destination.city;
        const nights = destination.nights || 1;

        // Create a day for each night in this destination
        for (let night = 0; night < nights; night++) {
          const dayDate = new Date(currentDate);
          dayDate.setDate(currentDate.getDate() + night);

          daysToInsert.push({
            itinerary_id: itineraryId,
            day_number: dayNumber,
            date: dayDate.toISOString().split('T')[0],
            city_name: cityName,
            display_order: dayNumber,
            time_slots: {
              morning: { time: '', activities: [], transfers: [] },
              afternoon: { time: '', activities: [], transfers: [] },
              evening: { time: '', activities: [], transfers: [] }
            },
            notes: null,
          });

          dayNumber++;
        }

        currentDate.setDate(currentDate.getDate() + nights);
      }

      // Insert all days
      if (daysToInsert.length > 0) {
        const { error: daysError } = await supabase
          .from('itinerary_days' as any)
          .insert(daysToInsert);

        if (daysError) throw daysError;
      }

      toast.success('Itinerary created successfully!');
      router.push(`/agent/itineraries/${itineraryId}/builder`);
    } catch (err) {
      console.error('Error creating itinerary:', err);
      toast.error('Failed to create itinerary. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lead details...</p>
          </div>
        </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Lead not found</p>
            <Button onClick={() => router.push('/agent/leads')}>
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </div>
        </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 lg:p-6">
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg">
            <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                <FiPackage className="w-5 h-5 text-blue-600" />
                  <CardTitle>Create New Itinerary</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Create a custom itinerary for <span className="font-semibold">{lead.destination}</span></p>
              </div>
              <Button variant="ghost" onClick={() => router.push('/agent/leads')}>
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Button>
            </div>
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

              {/* Query Destinations Preview */}
              {query && query.destinations && query.destinations.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FiMapPin className="w-4 h-4" />
                    Itinerary Destinations
                  </p>
                  <div className="space-y-2">
                    {query.destinations.map((dest: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {dest.city} - {dest.nights || 1} {dest.nights === 1 ? 'night' : 'nights'}
                        </span>
                        <Badge variant="secondary">{dest.nights || 1}N</Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Total: {query.destinations.reduce((sum: number, d: any) => sum + (d.nights || 1), 0)} nights
                  </p>
                </div>
              )}

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
  );
}

