'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiMail, FiPhone, FiMessageCircle, FiVideo, FiX, FiCheck, FiClock } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/CognitoAuthContext';
import { getAccessToken } from '@/lib/auth/getAccessToken';

interface AddCommunicationFormProps {
  leadId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const communicationTypes = [
  { value: 'email', label: 'Email', icon: FiMail, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'phone_call', label: 'Phone Call', icon: FiPhone, color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'whatsapp', label: 'WhatsApp', icon: FiMessageCircle, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'app_message', label: 'App Message', icon: FiMessageCircle, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'meeting', label: 'Meeting', icon: FiVideo, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'other', label: 'Other', icon: FiX, color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const responseOptions = [
  { value: 'positive', label: 'Positive', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'negative', label: 'Negative', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'no_response', label: 'No Response', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

export function AddCommunicationForm({ leadId, open, onClose, onSuccess }: AddCommunicationFormProps): React.ReactPortal | null {
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    communication_type: 'email' as 'email' | 'phone_call' | 'app_message' | 'whatsapp' | 'meeting' | 'other',
    direction: 'outbound' as 'outbound' | 'inbound',
    subject: '',
    content: '',
    sent_at: '',
    received_at: '',
    customer_response: '' as 'positive' | 'negative' | 'no_response' | 'pending' | '',
    response_notes: '',
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.communication_type || !formData.direction) {
      toast.error('Please select communication type and direction');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/communications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() || ''}`,
        },
        body: JSON.stringify({
          ...formData,
          customer_response: formData.customer_response || null,
          sent_at: formData.sent_at || null,
          received_at: formData.received_at || null,
        }),
      });

      if (response.ok) {
        toast.success('Communication added successfully');
        setFormData({
          communication_type: 'email',
          direction: 'outbound',
          subject: '',
          content: '',
          sent_at: '',
          received_at: '',
          customer_response: '',
          response_notes: '',
        });
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add communication');
      }
    } catch (error) {
      console.error('Error adding communication:', error);
      toast.error('Failed to add communication');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" 
      onClick={(e) => {
        // Only close if clicking directly on the overlay, not on child elements
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ pointerEvents: 'auto', zIndex: 100 }}
    >
      <Card 
        className="w-full max-w-2xl mx-4 bg-white shadow-2xl max-h-[90vh] overflow-y-auto relative" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          pointerEvents: 'auto', 
          position: 'relative',
          zIndex: 101,
          isolation: 'isolate'
        }}
      >
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Add Communication</CardTitle>
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
        <CardContent className="p-6" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 102, isolation: 'isolate' }}>
          <form onSubmit={handleSubmit} className="space-y-6" style={{ pointerEvents: 'auto', position: 'relative' }}>
            {/* Communication Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Communication Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {communicationTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.communication_type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, communication_type: type.value as any }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `${type.color} border-current`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? '' : 'text-gray-400'}`} />
                      <span className={`text-xs ${isSelected ? 'font-semibold' : 'text-gray-600'}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direction *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, direction: 'outbound' }))}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    formData.direction === 'outbound'
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className={`text-sm font-medium ${formData.direction === 'outbound' ? '' : 'text-gray-600'}`}>
                    Outbound
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, direction: 'inbound' }))}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    formData.direction === 'inbound'
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className={`text-sm font-medium ${formData.direction === 'inbound' ? '' : 'text-gray-600'}`}>
                    Inbound
                  </span>
                </button>
              </div>
            </div>

            {/* Subject (for emails) */}
            {formData.communication_type === 'email' && (
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                  className="w-full"
                  style={{ pointerEvents: 'auto', zIndex: 103 }}
                />
              </div>
            )}

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content / Notes *
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter message content, call notes, or meeting summary..."
                rows={4}
                className="w-full"
                required
                style={{ pointerEvents: 'auto', zIndex: 103 }}
              />
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sent_at" className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.direction === 'outbound' ? 'Sent At' : 'Received At'}
                </label>
                <Input
                  id="sent_at"
                  type="datetime-local"
                  value={formData.sent_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, sent_at: e.target.value }))}
                  className="w-full"
                  style={{ pointerEvents: 'auto', zIndex: 103 }}
                />
              </div>
              {formData.direction === 'inbound' && (
                <div>
                  <label htmlFor="received_at" className="block text-sm font-medium text-gray-700 mb-2">
                    Received At
                  </label>
                  <Input
                    id="received_at"
                    type="datetime-local"
                    value={formData.received_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, received_at: e.target.value }))}
                    className="w-full"
                    style={{ pointerEvents: 'auto', zIndex: 103 }}
                  />
                </div>
              )}
            </div>

            {/* Customer Response */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Response
              </label>
              <div className="grid grid-cols-4 gap-2">
                {responseOptions.map((option) => {
                  const isSelected = formData.customer_response === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, customer_response: option.value as any }))}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `${option.color} border-current`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className={`text-xs ${isSelected ? 'font-semibold' : 'text-gray-600'}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Response Notes */}
            {formData.customer_response && (
              <div>
                <label htmlFor="response_notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Response Notes
                </label>
                <Textarea
                  id="response_notes"
                  value={formData.response_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, response_notes: e.target.value }))}
                  placeholder="Add any additional notes about the customer's response..."
                  rows={3}
                  className="w-full"
                  style={{ pointerEvents: 'auto', zIndex: 103 }}
                />
              </div>
            )}

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
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <FiClock className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4 mr-2" />
                    Save Communication
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  // Render in portal to ensure it's above all other modals
  if (typeof window === 'undefined') {
    return null;
  }
  
  return createPortal(modalContent, document.body);
}

