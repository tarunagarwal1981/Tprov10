'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiClock, FiDollarSign } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/CognitoAuthContext';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface ConfirmPaymentModalProps {
  itineraryId: string;
  totalPrice: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentTypes = [
  { value: 'deposit', label: 'Deposit', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'partial', label: 'Partial Payment', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'full', label: 'Full Payment', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'refund', label: 'Refund', color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

const paymentMethods = [
  'bank_transfer',
  'credit_card',
  'debit_card',
  'cash',
  'check',
  'paypal',
  'other',
];

export function ConfirmPaymentModal({
  itineraryId,
  totalPrice,
  open,
  onClose,
  onSuccess,
}: ConfirmPaymentModalProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [formData, setFormData] = useState({
    amount: '',
    payment_type: 'partial' as 'deposit' | 'partial' | 'full' | 'refund',
    payment_method: '',
    payment_reference: '',
    received_at: '',
    notes: '',
  });

  // Fetch existing payments to calculate total paid
  useEffect(() => {
    if (open && itineraryId) {
      fetchPayments();
    }
  }, [open, itineraryId]);

  const fetchPayments = async () => {
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/itineraries/${itineraryId}/payments`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });
      if (response.ok) {
        const { payments: paymentsData } = await response.json();
        setPayments(paymentsData || []);
        const paid = (paymentsData || []).reduce((sum: number, payment: any) => {
          if (payment.payment_type === 'refund') {
            return sum - payment.amount;
          }
          return sum + payment.amount;
        }, 0);
        setTotalPaid(paid);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.payment_type) {
      toast.error('Please select payment type');
      return;
    }

    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/itineraries/${itineraryId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          payment_type: formData.payment_type,
          payment_method: formData.payment_method || null,
          payment_reference: formData.payment_reference || null,
          received_at: formData.received_at || null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        const { payment } = await response.json();
        const newTotalPaid = totalPaid + parseFloat(formData.amount);
        const remaining = totalPrice - newTotalPaid;
        
        toast.success('Payment recorded. Itinerary confirmed automatically.');
        setFormData({
          amount: '',
          payment_type: 'partial',
          payment_method: '',
          payment_reference: '',
          received_at: '',
          notes: '',
        });
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const remaining = totalPrice - totalPaid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-lg mx-4 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Confirm Payment</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <FiX className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Price:</span>
              <span className="text-lg font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Paid:</span>
              <span className="text-lg font-semibold text-green-600">${totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Remaining:</span>
              <span className={`text-lg font-bold ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                ${remaining.toFixed(2)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {paymentTypes.map((type) => {
                  const isSelected = formData.payment_type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: type.value as any }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `${type.color} border-current`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className={`text-sm ${isSelected ? 'font-semibold' : 'text-gray-600'}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select method</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Reference */}
            <div>
              <label htmlFor="payment_reference" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference
              </label>
              <Input
                id="payment_reference"
                value={formData.payment_reference}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
                placeholder="Transaction ID, check number, etc."
                className="w-full"
              />
            </div>

            {/* Received At */}
            <div>
              <label htmlFor="received_at" className="block text-sm font-medium text-gray-700 mb-2">
                Received Date
              </label>
              <Input
                id="received_at"
                type="datetime-local"
                value={formData.received_at}
                onChange={(e) => setFormData(prev => ({ ...prev, received_at: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this payment..."
                rows={3}
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                {loading ? (
                  <>
                    <FiClock className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

