# Quick Start Guide - Payment Infrastructure

## 🚀 Getting Started

This guide will help you quickly set up and use the payment infrastructure that's been implemented.

---

## Step 1: Run Database Migration

Run the migration to create all payment infrastructure tables:

```bash
# If using Supabase CLI
supabase migration up

# Or run the SQL file directly in your database
psql -h your-db-host -U your-user -d your-database -f supabase/migrations/020_payment_infrastructure.sql
```

**Verify tables created:**
- `payments`
- `payment_idempotency`
- `fraud_prevention_logs`
- `terms_acceptance`
- `refund_policies`
- `payment_metrics`

---

## Step 2: Test the Services

### Test Payment Creation
```typescript
import { PaymentService, PaymentStatus } from '@/lib/services/paymentService';

const payment = await PaymentService.createPayment({
  purchaseId: 'test-purchase-id',
  userId: 'test-user-id',
  amount: 100.00,
  currency: 'USD',
});

console.log('Payment created:', payment.id, payment.status); // Should be 'pending'
```

### Test Idempotency
```typescript
import { IdempotencyService } from '@/lib/services/idempotencyService';

const key = IdempotencyService.generateIdempotencyKey('test');

const existing = await IdempotencyService.checkIdempotency({
  idempotencyKey: key,
  userId: 'test-user-id',
  requestBody: { test: 'data' },
});

console.log('Idempotency check:', existing); // Should be null for new request
```

### Test Fraud Prevention
```typescript
import { FraudPreventionService } from '@/lib/services/fraudPreventionService';

const fraudCheck = await FraudPreventionService.performFraudChecks({
  userId: 'test-user-id',
  amount: 100.00,
  ipAddress: '1.2.3.4',
  userAgent: 'Mozilla/5.0...',
});

console.log('Fraud check:', fraudCheck.passed, fraudCheck.riskScore);
```

---

## Step 3: Add UI Components

### In Agent Dashboard

Add payment placeholder to purchase flow:

```tsx
// src/app/agent/marketplace/[leadId]/purchase/page.tsx
import { PaymentGatewayPlaceholder } from '@/components/payments/PaymentGatewayPlaceholder';

export default function PurchasePage() {
  const leadPrice = 100.00; // Get from lead data
  
  return (
    <div>
      <h1>Purchase Lead</h1>
      <PaymentGatewayPlaceholder
        amount={leadPrice}
        currency="USD"
        variant="agent"
        onPaymentInitiated={() => {
          // Handle payment initiation
          console.log('Payment initiated');
        }}
      />
    </div>
  );
}
```

### In Operator Dashboard

Add payment status badge:

```tsx
// src/app/operator/payments/page.tsx
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { PaymentStatus } from '@/lib/services/paymentService';

export default function PaymentsPage() {
  return (
    <div>
      <h1>Payments</h1>
      <PaymentStatusBadge 
        status={PaymentStatus.COMPLETED}
        showIcon={true}
        size="md"
      />
    </div>
  );
}
```

---

## Step 4: Test Purchase Flow

The purchase API (`/api/marketplace/purchase`) now includes:

1. ✅ Terms of Service validation
2. ✅ Idempotency protection
3. ✅ Fraud prevention checks
4. ✅ Payment record creation
5. ⚠️ Payment gateway placeholder (not yet integrated)

**Test the flow:**
```bash
curl -X POST http://localhost:3000/api/marketplace/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "leadId": "lead-id",
    "agentId": "agent-id",
    "idempotencyKey": "test-key-123"
  }'
```

**Expected response:**
```json
{
  "purchase": { ... },
  "payment": {
    "id": "payment-id",
    "status": "pending",
    "amount": 100.00,
    "currency": "USD",
    "message": "Payment gateway integration pending. Purchase recorded."
  },
  "warning": "Payment gateway not yet integrated"
}
```

---

## Step 5: Monitor Payments

### Check Payment Status
```typescript
import { PaymentService } from '@/lib/services/paymentService';

const payment = await PaymentService.getPaymentById('payment-id');
console.log('Payment status:', payment?.status);
```

### Get User's Payments
```typescript
const payments = await PaymentService.getPaymentsByUserId('user-id', 10, 0);
console.log('User payments:', payments);
```

### Check Fraud Logs
```sql
SELECT * FROM fraud_prevention_logs 
WHERE user_id = 'user-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔧 Configuration

### Fraud Prevention Limits

Default limits (can be customized):
- Max purchases per hour: 5
- Max purchases per day: 20
- Max amount per transaction: $10,000
- Max amount per day: $50,000

To customize:
```typescript
import { FraudPreventionService } from '@/lib/services/fraudPreventionService';

FraudPreventionService.setConfig({
  maxPurchasesPerHour: 10,
  maxAmountPerTransaction: 20000,
});
```

---

## 📝 Next Steps

1. **Payment Gateway Integration** (When Ready)
   - Choose gateway (Stripe recommended)
   - Replace `PaymentService.processPaymentWithGateway()` placeholder
   - Add webhook endpoint
   - Test end-to-end

2. **Add Terms Acceptance UI**
   - Create terms acceptance modal
   - Show on first purchase
   - Track acceptance

3. **Payment Dashboard**
   - Create payment analytics page
   - Show payment metrics
   - Display fraud alerts

---

## 🐛 Troubleshooting

### Payment creation fails
- Check database migration ran successfully
- Verify `payments` table exists
- Check user permissions

### Idempotency not working
- Verify `payment_idempotency` table exists
- Check idempotency key format
- Ensure request body is consistent

### Fraud checks blocking legitimate users
- Adjust fraud prevention limits
- Check fraud logs for details
- Review risk score calculation

---

## 📚 Documentation

- **Full Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Implementation Plan:** `IMPLEMENTATION_PLAN_PAYMENT_INFRASTRUCTURE.md`
- **Production Readiness:** `PRODUCTION_READINESS_ASSESSMENT.md`

---

**Need Help?** Check the service files for detailed JSDoc comments and examples.
