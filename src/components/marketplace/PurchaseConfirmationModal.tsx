"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaDollarSign,
  FaClock,
  FaUsers,
  FaStar,
  FaShieldAlt,
  FaEye,
  FaPhone,
  FaEnvelope,
  FaLock,
  FaTimes,
} from 'react-icons/fa';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MarketplaceLead, getTripTypeLabel, formatQualityScore } from '@/lib/types/marketplace';

/**
 * Purchase Confirmation Modal Props
 */
export interface PurchaseConfirmationModalProps {
  lead: MarketplaceLead;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

/**
 * Format currency value
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Format budget range
 */
const formatBudget = (min: number, max: number): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  return `${formatter.format(min)} - ${formatter.format(max)}`;
};

/**
 * Purchase Confirmation Modal Component
 * Confirms lead purchase with summary and terms acceptance
 */
export const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
  lead,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  /**
   * Handle confirm purchase
   */
  const handleConfirm = async () => {
    if (!agreedToTerms || isConfirming) return;

    setIsConfirming(true);
    try {
      await onConfirm();
      // Modal will close from parent component
      setAgreedToTerms(false);
    } catch (error) {
      console.error('Purchase failed:', error);
      // Error handling is done in parent component
    } finally {
      setIsConfirming(false);
    }
  };

  /**
   * Handle close
   */
  const handleClose = () => {
    if (isConfirming || loading) return;
    setAgreedToTerms(false);
    onClose();
  };

  const qualityStars = Math.round((lead.leadQualityScore / 100) * 5);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white z-50"
        closeOnOverlayClick={!isConfirming && !loading}
        preventClose={isConfirming || loading}
        variant="default"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FaShieldAlt className="w-6 h-6 text-blue-500" />
            Confirm Lead Purchase
          </DialogTitle>
          <DialogDescription className="text-base">
            Review the lead details and confirm your purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lead Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-blue-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">{lead.title}</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Destination */}
              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Destination</p>
                  <p className="text-sm font-semibold text-gray-900">{lead.destination}</p>
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-start gap-2">
                <FaDollarSign className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatBudget(lead.budgetMin, lead.budgetMax)}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-start gap-2">
                <FaClock className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {lead.durationDays} {lead.durationDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>

              {/* Travelers */}
              <div className="flex items-start gap-2">
                <FaUsers className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Travelers</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {lead.travelersCount} {lead.travelersCount === 1 ? 'person' : 'people'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quality Score */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Quality Score</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < qualityStars ? 'text-yellow-400' : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {lead.leadQualityScore}/100
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Price */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Purchase Price</p>
                <p className="text-3xl font-bold text-green-700">{formatCurrency(lead.leadPrice)}</p>
              </div>
              <div className="text-green-600">
                <FaDollarSign className="w-12 h-12 opacity-20" />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              One-time payment • Full access to lead details
            </p>
          </div>

          <Separator />

          {/* Benefits List */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaCheckCircle className="w-5 h-5 text-green-500" />
              What You&apos;ll Get
            </h4>
            <div className="space-y-2">
              {[
                {
                  icon: FaEye,
                  text: 'Full access to customer contact details',
                  color: 'text-blue-500',
                },
                {
                  icon: FaPhone,
                  text: 'Direct phone number and email address',
                  color: 'text-purple-500',
                },
                {
                  icon: FaEnvelope,
                  text: 'Detailed travel requirements and preferences',
                  color: 'text-green-500',
                },
                {
                  icon: FaLock,
                  text: 'Exclusive rights - No other agent can purchase',
                  color: 'text-orange-500',
                },
                {
                  icon: FaShieldAlt,
                  text: 'Lead quality guarantee and support',
                  color: 'text-indigo-500',
                },
              ].map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', benefit.color)} />
                    <span className="text-sm text-gray-700">{benefit.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Terms and Conditions */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Important Notice</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>All purchases are final and non-refundable</li>
                  <li>You will have exclusive access to this lead</li>
                  <li>Payment will be processed immediately</li>
                  <li>Lead information will be available after purchase</li>
                </ul>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group mt-3 pt-3 border-t border-yellow-300">
              <Checkbox
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                disabled={isConfirming || loading}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors flex-1">
                I agree to the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-700 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms and Conditions
                </a>{' '}
                and understand that this purchase is final
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isConfirming || loading}
          >
            <FaTimes className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={!agreedToTerms || isConfirming || loading}
            loading={isConfirming || loading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 min-w-[160px]"
          >
            {isConfirming || loading ? (
              'Processing...'
            ) : (
              <>
                <FaCheckCircle className="w-4 h-4 mr-2" />
                Confirm Purchase
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseConfirmationModal;

