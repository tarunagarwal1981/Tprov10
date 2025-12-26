'use client';

import React, { useState, useEffect } from 'react';
import { FiPackage, FiDollarSign, FiFileText, FiCheck, FiClock, FiLock } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface Itinerary {
  id: string;
  name: string;
  customer_id: string | null;
  status: string;
  total_price: number;
  confirmed_at: string | null;
  is_locked: boolean;
  created_at: string;
}

export default function OperationsDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [confirmedItineraries, setConfirmedItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchConfirmedItineraries();
    }
  }, [user?.id]);

  const fetchConfirmedItineraries = async () => {
    try {
      setLoading(true);
      // Fetch all confirmed itineraries
      const accessToken = getAccessToken();
      const response = await fetch('/api/itineraries/confirmed', {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });
      if (response.ok) {
        const { itineraries } = await response.json();
        setConfirmedItineraries(itineraries || []);
      } else {
        toast.error('Failed to fetch confirmed itineraries');
      }
    } catch (error) {
      console.error('Error fetching confirmed itineraries:', error);
      toast.error('Failed to fetch confirmed itineraries');
    } finally {
      setLoading(false);
    }
  };

  const totalConfirmed = confirmedItineraries.length;
  const totalValue = confirmedItineraries.reduce((sum, it) => sum + (it.total_price || 0), 0);
  const lockedCount = confirmedItineraries.filter(it => it.is_locked).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operations dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage confirmed itineraries, vouchers, and payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Confirmed Itineraries</p>
                <p className="text-2xl font-bold text-gray-900">{totalConfirmed}</p>
              </div>
              <FiCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
              </div>
              <FiDollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Locked Itineraries</p>
                <p className="text-2xl font-bold text-gray-900">{lockedCount}</p>
              </div>
              <FiLock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmed Itineraries List */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Confirmed Itineraries</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {confirmedItineraries.length === 0 ? (
            <div className="text-center py-12">
              <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No confirmed itineraries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {confirmedItineraries.map((itinerary) => (
                <div
                  key={itinerary.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{itinerary.name}</span>
                      {itinerary.customer_id && (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                          {itinerary.customer_id}
                        </Badge>
                      )}
                      {itinerary.is_locked && (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <FiLock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Status: {itinerary.status}</span>
                      <span>Total: ${(itinerary.total_price || 0).toFixed(2)}</span>
                      {itinerary.confirmed_at && (
                        <span>Confirmed: {new Date(itinerary.confirmed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

