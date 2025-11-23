'use client';

import React, { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiGlobe, FiCopy, FiCheck } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { OperatorInfo } from '@/lib/services/itineraryService';
import { useToast } from '@/hooks/useToast';

interface OperatorContactViewProps {
  itineraryId: string;
  open: boolean;
  onClose: () => void;
}

export function OperatorContactView({
  itineraryId,
  open,
  onClose,
}: OperatorContactViewProps) {
  const toast = useToast();
  // itineraryService now accessed via API routes
  const [operators, setOperators] = useState<OperatorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && itineraryId) {
      fetchOperators();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itineraryId]);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/operators`);
      if (!response.ok) throw new Error('Failed to fetch operators');
      const { operators: data } = await response.json();
      setOperators(data);
    } catch (err) {
      console.error('Error fetching operators:', err);
      toast.error('Failed to load operator information');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handlePhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Operator Contact Information</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            All tour operators used in this itinerary
          </p>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading operator information...</p>
              </div>
            </div>
          ) : operators.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No operators found</p>
            </div>
          ) : (
            operators.map((operator) => (
              <Card key={operator.operator_id} className="bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{operator.operator_name}</CardTitle>
                    <Badge variant="outline">
                      {operator.packages.length} package{operator.packages.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {operator.operator_email && (
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FiMail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 mb-1">Email</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {operator.operator_email}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEmail(operator.operator_email!)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <FiMail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(operator.operator_email!, `email-${operator.operator_id}`)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            {copiedId === `email-${operator.operator_id}` ? (
                              <FiCheck className="w-4 h-4 text-green-600" />
                            ) : (
                              <FiCopy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {operator.operator_phone && (
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FiPhone className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 mb-1">Phone</p>
                          <p className="text-sm font-medium text-gray-900">
                            {operator.operator_phone}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePhone(operator.operator_phone!)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <FiPhone className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(operator.operator_phone!, `phone-${operator.operator_id}`)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            {copiedId === `phone-${operator.operator_id}` ? (
                              <FiCheck className="w-4 h-4 text-green-600" />
                            ) : (
                              <FiCopy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Packages from this operator */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Packages:</p>
                    <div className="space-y-2">
                      {operator.packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Badge className="text-xs" variant="outline">
                              {pkg.package_type.replace('_', ' ')}
                            </Badge>
                            <span className="font-medium text-gray-900">{pkg.package_title}</span>
                          </div>
                          <span className="text-gray-600 font-semibold">
                            ${pkg.total_price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button
            onClick={() => {
              // Export all contacts
              const contactText = operators.map(op => {
                let text = `${op.operator_name}\n`;
                if (op.operator_email) text += `Email: ${op.operator_email}\n`;
                if (op.operator_phone) text += `Phone: ${op.operator_phone}\n`;
                text += '\n';
                return text;
              }).join('\n');

              navigator.clipboard.writeText(contactText);
              toast.success('All contacts copied to clipboard');
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FiCopy className="w-4 h-4 mr-2" />
            Copy All Contacts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

