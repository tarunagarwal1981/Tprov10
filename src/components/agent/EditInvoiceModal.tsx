'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiFileText, FiDownload, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string | null;
  billing_address: BillingAddress | null;
  payment_terms: string | null;
  notes: string | null;
  currency: string | null;
  line_items: LineItem[] | null;
}

interface EditInvoiceModalProps {
  invoice: Invoice;
  itineraryId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'];

export function EditInvoiceModal({
  invoice,
  itineraryId,
  open,
  onClose,
  onSuccess,
}: EditInvoiceModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [invoiceUpdated, setInvoiceUpdated] = useState(false);
  
  const [formData, setFormData] = useState({
    currency: invoice.currency || 'USD',
    billing_address: invoice.billing_address || {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    } as BillingAddress,
    line_items: invoice.line_items || [] as LineItem[],
    tax_rate: (invoice.tax_rate || 0).toString(),
    payment_terms: invoice.payment_terms || '',
    notes: invoice.notes || '',
    due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
    status: invoice.status,
  });

  // Reset form when invoice changes
  useEffect(() => {
    if (open && invoice) {
      setFormData({
        currency: invoice.currency || 'USD',
        billing_address: invoice.billing_address || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: '',
        },
        line_items: invoice.line_items || [],
        tax_rate: (invoice.tax_rate || 0).toString(),
        payment_terms: invoice.payment_terms || '',
        notes: invoice.notes || '',
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
        status: invoice.status,
      });
      setInvoiceUpdated(false);
    }
  }, [open, invoice]);

  // Calculate totals
  const subtotal = formData.line_items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (parseFloat(formData.tax_rate) / 100);
  const totalAmount = subtotal + taxAmount;

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updated.total = updated.quantity * updated.unit_price;
          }
          return updated;
        }
        return item;
      }),
    }));
  };

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          id: `item-${Date.now()}`,
          description: '',
          quantity: 1,
          unit_price: 0,
          total: 0,
        },
      ],
    }));
  };

  const handleRemoveLineItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter(item => item.id !== id),
    }));
  };

  const handleBillingAddressChange = (field: keyof BillingAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      billing_address: {
        ...prev.billing_address,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.line_items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    if (formData.line_items.some(item => !item.description || item.total <= 0)) {
      toast.error('Please fill in all line items with valid amounts');
      return;
    }

    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          subtotal: subtotal,
          tax_rate: parseFloat(formData.tax_rate) || 0,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          due_date: formData.due_date || null,
          billing_address: formData.billing_address.street ? formData.billing_address : null,
          payment_terms: formData.payment_terms || null,
          notes: formData.notes || null,
          currency: formData.currency,
          line_items: formData.line_items,
          status: formData.status,
        }),
      });

      if (response.ok) {
        setInvoiceUpdated(true);
        toast.success('Invoice updated successfully');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!itineraryId || !invoice.id) return;
    
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/itineraries/${itineraryId}/invoice/pdf?invoiceId=${invoice.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoice_number}.pdf`;
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <Card className="w-full max-w-4xl mx-auto bg-white shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Edit Invoice - {invoice.invoice_number}</CardTitle>
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
          {!invoiceUpdated ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Currency Selection */}
              <div>
                <Label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Billing Address Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Billing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="billing_street">Street Address</Label>
                    <Input
                      id="billing_street"
                      value={formData.billing_address.street}
                      onChange={(e) => handleBillingAddressChange('street', e.target.value)}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_city">City</Label>
                    <Input
                      id="billing_city"
                      value={formData.billing_address.city}
                      onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_state">State/Province</Label>
                    <Input
                      id="billing_state"
                      value={formData.billing_address.state}
                      onChange={(e) => handleBillingAddressChange('state', e.target.value)}
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_zip">ZIP/Postal Code</Label>
                    <Input
                      id="billing_zip"
                      value={formData.billing_address.zip}
                      onChange={(e) => handleBillingAddressChange('zip', e.target.value)}
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_country">Country</Label>
                    <Input
                      id="billing_country"
                      value={formData.billing_address.country}
                      onChange={(e) => handleBillingAddressChange('country', e.target.value)}
                      placeholder="USA"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 flex-1">Line Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineItem}
                    className="ml-4"
                  >
                    <FiPlus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.line_items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-5">
                        <Label className="text-xs text-gray-600">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-600">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-600">Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-600">Total</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.total.toFixed(2)}
                          readOnly
                          className="text-sm bg-gray-100"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Totals Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900">Tax & Totals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">{formData.currency} {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                      <span className="font-semibold">{formData.currency} {taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-green-600">{formData.currency} {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  placeholder="e.g., Net 30, Due on receipt"
                />
              </div>

              {/* Due Date */}
              <div>
                <Label htmlFor="due_date">Due Date (Optional)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or instructions"
                  rows={3}
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiFileText className="w-4 h-4 mr-2" />
                      Update Invoice
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
                  <p className="font-semibold">Invoice updated successfully!</p>
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

