'use client';

import React, { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiMail, FiCheck, FiClock, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/CognitoAuthContext';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  sent_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  pdf_url: string | null;
  created_at: string;
}

interface InvoiceListProps {
  itineraryId: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'sent':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'paid':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'overdue':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-500 border-gray-200';
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

export function InvoiceList({ itineraryId }: InvoiceListProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [itineraryId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices?itineraryId=${itineraryId}`, {
        headers: {
          'Authorization': `Bearer ${user?.accessToken || ''}`,
        },
      });
      if (response.ok) {
        const { invoices: invoicesData } = await response.json();
        setInvoices(invoicesData || []);
      } else {
        toast.error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/invoice/pdf`, {
        headers: {
          'Authorization': `Bearer ${user?.accessToken || ''}`,
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceNumber}.pdf`;
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
      toast.error('Failed to download PDF');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken || ''}`,
        },
        body: JSON.stringify({
          status: 'paid',
          paid_at: new Date().toISOString(),
        }),
      });
      if (response.ok) {
        toast.success('Invoice marked as paid');
        fetchInvoices();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

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
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Invoices</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No invoices created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                    <Badge variant="outline" className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-gray-900">{formatCurrency(invoice.total_amount)}</span>
                    {invoice.due_date && (
                      <span className="text-gray-600">
                        Due: {formatDate(invoice.due_date)}
                      </span>
                    )}
                    {invoice.sent_at && (
                      <span className="text-gray-500 text-xs">
                        Sent: {formatDate(invoice.sent_at)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <FiDownload className="w-4 h-4" />
                  </Button>
                  {invoice.status === 'sent' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsPaid(invoice.id)}
                      className="border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <FiCheck className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

