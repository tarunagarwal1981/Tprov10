'use client';

import React, { useState } from 'react';
import { FiX, FiFileText, FiDownload, FiCheck } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface GenerateInvoiceModalProps {
  itineraryId: string;
  totalPrice: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GenerateInvoiceModal({
  itineraryId,
  totalPrice,
  open,
  onClose,
  onSuccess,
}: GenerateInvoiceModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    total_amount: totalPrice.toString(),
    due_date: '',
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.total_amount);
    if (!formData.total_amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          itinerary_id: itineraryId,
          total_amount: amount,
          due_date: formData.due_date || null,
        }),
      });

      if (response.ok) {
        const { invoice } = await response.json();
        setInvoiceId(invoice.id);
        setInvoiceCreated(true);
        toast.success('Invoice created successfully');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!itineraryId) return;
    
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/itineraries/${itineraryId}/invoice/pdf`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${itineraryId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Invoice PDF downloaded');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      toast.error('Failed to download invoice PDF');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-lg mx-4 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Generate Invoice</CardTitle>
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
          {!invoiceCreated ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Total Amount */}
              <div>
                <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount *
                </label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Itinerary total price: ${totalPrice.toFixed(2)}
                </p>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (Optional)
                </label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
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
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  {loading ? (
                    <>
                      <FiFileText className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiFileText className="w-4 h-4 mr-2" />
                      Create Invoice
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <FiCheck className="w-5 h-5" />
                  <p className="font-semibold">Invoice created successfully!</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

