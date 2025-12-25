'use client';

import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiGlobe, FiCopy, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';

interface OperatorDetails {
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  whatsapp: string | null;
}

interface OperatorContactCardProps {
  operatorId: string;
  operatorDetails: OperatorDetails;
  variant?: 'inline' | 'modal';
}

export function OperatorContactCard({ operatorId, operatorDetails, variant = 'inline' }: OperatorContactCardProps) {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const hasContactInfo = operatorDetails.email || operatorDetails.phone || operatorDetails.website || operatorDetails.address || operatorDetails.whatsapp;

  if (variant === 'modal') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => setShowModal(true)}
        >
          View Details
        </Button>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <Card className="w-full max-w-md mx-4 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{operatorDetails.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowModal(false)}
                  >
                    <FiX className="w-4 h-4" />
                  </Button>
                </div>
                {hasContactInfo ? (
                  <div className="space-y-3">
                    {operatorDetails.email && (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 flex-1">
                          <FiMail className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{operatorDetails.email}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(operatorDetails.email!, 'Email')}
                        >
                          <FiCopy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {operatorDetails.phone && (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 flex-1">
                          <FiPhone className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">{operatorDetails.phone}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(operatorDetails.phone!, 'Phone')}
                        >
                          <FiCopy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {operatorDetails.whatsapp && (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 flex-1">
                          <FiPhone className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">WhatsApp: {operatorDetails.whatsapp}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(operatorDetails.whatsapp!, 'WhatsApp')}
                        >
                          <FiCopy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {operatorDetails.website && (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 flex-1">
                          <FiGlobe className="w-4 h-4 text-purple-600" />
                          <a
                            href={operatorDetails.website.startsWith('http') ? operatorDetails.website : `https://${operatorDetails.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {operatorDetails.website}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(operatorDetails.website!, 'Website')}
                        >
                          <FiCopy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {operatorDetails.address && (
                      <div className="flex items-start justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 flex-1">
                          <FiMapPin className="w-4 h-4 text-red-600 mt-0.5" />
                          <span className="text-sm text-gray-700">{operatorDetails.address}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(operatorDetails.address!, 'Address')}
                        >
                          <FiCopy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No contact information available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  // Inline expandable variant
  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 px-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <>
            <FiChevronUp className="w-3 h-3 mr-1" />
            Hide Details
          </>
        ) : (
          <>
            <FiChevronDown className="w-3 h-3 mr-1" />
            View Details
          </>
        )}
      </Button>
      {isExpanded && hasContactInfo && (
        <Card className="mt-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-2">
              {operatorDetails.email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiMail className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-gray-700">{operatorDetails.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => copyToClipboard(operatorDetails.email!, 'Email')}
                  >
                    <FiCopy className="w-3 h-3" />
                  </Button>
                </div>
              )}
              {operatorDetails.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-gray-700">{operatorDetails.phone}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => copyToClipboard(operatorDetails.phone!, 'Phone')}
                  >
                    <FiCopy className="w-3 h-3" />
                  </Button>
                </div>
              )}
              {operatorDetails.whatsapp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-gray-700">WhatsApp: {operatorDetails.whatsapp}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => copyToClipboard(operatorDetails.whatsapp!, 'WhatsApp')}
                  >
                    <FiCopy className="w-3 h-3" />
                  </Button>
                </div>
              )}
              {operatorDetails.website && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiGlobe className="w-3 h-3 text-purple-600" />
                    <a
                      href={operatorDetails.website.startsWith('http') ? operatorDetails.website : `https://${operatorDetails.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {operatorDetails.website}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => copyToClipboard(operatorDetails.website!, 'Website')}
                  >
                    <FiCopy className="w-3 h-3" />
                  </Button>
                </div>
              )}
              {operatorDetails.address && (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <FiMapPin className="w-3 h-3 text-red-600 mt-0.5" />
                    <span className="text-xs text-gray-700">{operatorDetails.address}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => copyToClipboard(operatorDetails.address!, 'Address')}
                  >
                    <FiCopy className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

