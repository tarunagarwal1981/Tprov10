'use client';

import React from 'react';
import { CreditCard, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentGatewayPlaceholderProps {
  amount: number;
  currency?: string;
  onPaymentInitiated?: () => void;
  className?: string;
  variant?: 'agent' | 'operator';
}

/**
 * Payment Gateway Placeholder Component
 * 
 * This component provides a placeholder UI for payment gateway integration.
 * It can be used on both agent and operator sides.
 * 
 * When payment gateway is integrated, this component will be replaced with
 * the actual payment gateway component (Stripe, PayPal, etc.)
 */
export function PaymentGatewayPlaceholder({
  amount,
  currency = 'USD',
  onPaymentInitiated,
  className = '',
  variant = 'agent',
}: PaymentGatewayPlaceholderProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);

  const handlePlaceholderClick = () => {
    // This is a placeholder - actual payment gateway integration will handle this
    console.log('[PaymentGatewayPlaceholder] Payment gateway not yet integrated');
    
    if (onPaymentInitiated) {
      onPaymentInitiated();
    }
  };

  return (
    <div className={`payment-gateway-placeholder ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700">
              Payment Gateway
            </h3>
          </div>
          <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
            Placeholder
          </div>
        </div>

        {/* Amount Display */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Amount to Pay</div>
          <div className="text-3xl font-bold text-gray-900">{formattedAmount}</div>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">
                Payment Gateway Integration Pending
              </h4>
              <p className="text-sm text-blue-700">
                The payment gateway integration is currently being developed.
                This is a placeholder component that will be replaced with the
                actual payment processing interface (Stripe, PayPal, etc.) once
                integration is complete.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Payment Form */}
        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Placeholder Button */}
          <button
            onClick={handlePlaceholderClick}
            disabled
            className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Payment Gateway Not Integrated
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>
              Secure payment processing will be enabled once gateway integration is complete
            </span>
          </div>
        </div>

        {/* Variant-specific content */}
        {variant === 'operator' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <strong>Operator Note:</strong> This payment interface will be used
              for receiving payments from customers booking your packages.
            </div>
          </div>
        )}

        {variant === 'agent' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <strong>Agent Note:</strong> This payment interface will be used
              for purchasing leads from the marketplace.
            </div>
          </div>
        )}
      </motion.div>

      <style jsx>{`
        .payment-gateway-placeholder {
          max-width: 500px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
