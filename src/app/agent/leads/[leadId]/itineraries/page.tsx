'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiPlus, FiCopy, FiTrash2, FiEdit2, FiEye, FiFileText } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentDashboardLayout } from '@/components/dashboard/AgentDashboardLayout';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/useToast';
import { itineraryService, Itinerary } from '@/lib/services/itineraryService';

export default function LeadItinerariesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const leadId = params.leadId as string;

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    if (leadId) {
      fetchItineraries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const fetchItineraries = async () => {
    setLoading(true);
    try {
      const data = await itineraryService.getLeadItineraries(leadId);
      setItineraries(data);
    } catch (err) {
      console.error('Error fetching itineraries:', err);
      toast.error('Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (itineraryId: string) => {
    const newName = prompt('Enter name for duplicate itinerary:', 'Copy of Itinerary');
    if (!newName) return;

    setDuplicatingId(itineraryId);
    try {
      const newItinerary = await itineraryService.duplicateItinerary(itineraryId, newName);
      toast.success('Itinerary duplicated successfully');
      setItineraries(prev => [newItinerary, ...prev]);
    } catch (err) {
      console.error('Error duplicating itinerary:', err);
      toast.error('Failed to duplicate itinerary');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (itineraryId: string) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;

    try {
      const supabase = await import('@/lib/supabase/client').then(m => m.createClient());
      const { error } = await supabase
        .from('itineraries' as any)
        .delete()
        .eq('id', itineraryId);

      if (error) throw error;

      toast.success('Itinerary deleted successfully');
      setItineraries(prev => prev.filter(i => i.id !== itineraryId));
    } catch (err) {
      console.error('Error deleting itinerary:', err);
      toast.error('Failed to delete itinerary');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      completed: 'bg-blue-100 text-blue-700',
      sent: 'bg-green-100 text-green-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.draft;
  };

  if (loading) {
    return (
      <AgentDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading itineraries...</p>
          </div>
        </div>
      </AgentDashboardLayout>
    );
  }

  return (
    <AgentDashboardLayout>
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Itineraries</h1>
              <p className="text-gray-600">
                {itineraries.length} itinerary{itineraries.length !== 1 ? 's' : ''} for this lead
              </p>
            </div>
            <Button
              onClick={() => router.push(`/agent/leads/${leadId}/itineraries/new`)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Create New Itinerary
            </Button>
          </div>
        </motion.div>

        {/* Itineraries List */}
        {itineraries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Itineraries Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first itinerary to start building travel plans for this lead
              </p>
              <Button
                onClick={() => router.push(`/agent/leads/${leadId}/itineraries/new`)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Create First Itinerary
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itineraries.map((itinerary) => (
              <motion.div
                key={itinerary.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/agent/itineraries/${itinerary.id}/builder`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg font-semibold line-clamp-1">
                        {itinerary.name}
                      </CardTitle>
                      <Badge className={getStatusColor(itinerary.status)}>
                        {itinerary.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Travelers */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{itinerary.adults_count} Adults</span>
                      {itinerary.children_count > 0 && (
                        <span>{itinerary.children_count} Children</span>
                      )}
                      {itinerary.infants_count > 0 && (
                        <span>{itinerary.infants_count} Infants</span>
                      )}
                    </div>

                    {/* Total Price */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Total Price</span>
                      <span className="text-xl font-bold text-green-600">
                        ${itinerary.total_price.toFixed(2)}
                      </span>
                    </div>

                    {/* Dates */}
                    {(itinerary.start_date || itinerary.end_date) && (
                      <div className="text-xs text-gray-500">
                        {itinerary.start_date && (
                          <div>Start: {new Date(itinerary.start_date).toLocaleDateString()}</div>
                        )}
                        {itinerary.end_date && (
                          <div>End: {new Date(itinerary.end_date).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/agent/itineraries/${itinerary.id}/builder`)}
                        className="flex-1"
                      >
                        <FiEye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(itinerary.id)}
                        disabled={duplicatingId === itinerary.id}
                        className="flex-1"
                      >
                        <FiCopy className="w-4 h-4 mr-1" />
                        {duplicatingId === itinerary.id ? 'Copying...' : 'Duplicate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(itinerary.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AgentDashboardLayout>
  );
}

