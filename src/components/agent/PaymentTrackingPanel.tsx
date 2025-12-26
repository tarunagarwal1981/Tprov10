'use client';

import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiCheck, FiClock } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/CognitoAuthContext';
import { getAccessToken } from '@/lib/auth/getAccessToken';
import { AddPaymentForm } from './AddPaymentForm';

interface Payment {
  id: string;
  amount: number;
  payment_type: 'deposit' | 'partial' | 'full' | 'refund';
  payment_method: string | null;
  payment_reference: string | null;
  received_at: string | null;
  notes: string | null;
  created_at: string;
}

interface PaymentTrackingPanelProps {
  itineraryId: string;
  totalPrice: number;
}

const getPaymentTypeColor = (type: string) => {
  switch (type) {
    case 'deposit':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'partial':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'full':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'refund':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
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
    day: 'numeric' 
  });
};

export function PaymentTrackingPanel({ itineraryId, totalPrice }: PaymentTrackingPanelProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [itineraryId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const accessToken = getAccessToken();
      const response = await fetch(`/api/itineraries/${itineraryId}/payments`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });
      if (response.ok) {
        const { payments: paymentsData } = await response.json();
        setPayments(paymentsData || []);
      } else {
        toast.error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments.reduce((sum, payment) => {
    if (payment.payment_type === 'refund') {
      return sum - payment.amount;
    }
    return sum + payment.amount;
  }, 0);

  const remaining = totalPrice - totalPaid;
  const progressPercentage = totalPrice > 0 ? (totalPaid / totalPrice) * 100 : 0;

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
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Payment Tracking</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Price</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrice)}</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Payment Progress</span>
            <span className="text-sm font-semibold text-gray-900">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Payment History */}
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No payments recorded yet</p>
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add First Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getPaymentTypeColor(payment.payment_type)}>
                      {payment.payment_type}
                    </Badge>
                    {payment.payment_method && (
                      <span className="text-sm text-gray-600">{payment.payment_method}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
                    {payment.received_at && (
                      <span className="text-gray-600">
                        <FiClock className="w-3 h-3 inline mr-1" />
                        {formatDate(payment.received_at)}
                      </span>
                    )}
                    {payment.payment_reference && (
                      <span className="text-gray-500 text-xs">Ref: {payment.payment_reference}</span>
                    )}
                  </div>
                  {payment.notes && (
                    <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {showAddForm && (
        <AddPaymentForm
          itineraryId={itineraryId}
          open={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchPayments();
          }}
        />
      )}
    </Card>
  );
}

