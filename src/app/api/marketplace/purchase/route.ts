import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from '@/lib/services/marketplaceService';
import { PaymentService, PaymentStatus, PaymentMethod } from '@/lib/services/paymentService';
import { IdempotencyService } from '@/lib/services/idempotencyService';
import { FraudPreventionService } from '@/lib/services/fraudPreventionService';
import { TermsService } from '@/lib/services/termsService';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/marketplace/purchase
 * Purchase a lead with payment processing, idempotency, and fraud prevention
 */
export async function POST(request: NextRequest) {
  console.log('[Purchase API] POST handler called');
  
  try {
    console.log('[Purchase API] Parsing request body...');
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Purchase API] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { leadId, agentId, idempotencyKey } = body;
    console.log('[Purchase API] Request received:', { 
      leadId, 
      agentId, 
      idempotencyKey,
      bodyKeys: Object.keys(body || {}) 
    });

    if (!leadId || !agentId) {
      console.log('[Purchase API] Missing required fields:', { leadId: !!leadId, agentId: !!agentId });
      return NextResponse.json(
        { error: 'leadId and agentId are required' },
        { status: 400 }
      );
    }

    // Get user ID from token (for authentication)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId || userId !== agentId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check Terms of Service acceptance
    const hasAcceptedTerms = await TermsService.hasAcceptedAllRequiredTerms(userId);
    if (!hasAcceptedTerms) {
      return NextResponse.json(
        { 
          error: 'Terms of Service not accepted',
          requiresTermsAcceptance: true 
        },
        { status: 403 }
      );
    }

    // Get lead data to check price
    // We'll get the price from the purchase flow, but we need it for fraud checks
    // So we'll fetch it directly from the database
    const { queryOne } = await import('@/lib/aws/lambda-database');
    const leadData = await queryOne<{ id: string; lead_price: number; status: string }>(
      'SELECT id, lead_price, status FROM lead_marketplace WHERE id::text = $1',
      [leadId]
    );
    
    if (!leadData) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotencyKey || IdempotencyService.generateIdempotencyKey('purchase');

    // Check idempotency (prevent duplicate processing)
    const existingIdempotency = await IdempotencyService.checkIdempotency({
      idempotencyKey: finalIdempotencyKey,
      userId: agentId,
      requestBody: { leadId, agentId },
    });

    if (existingIdempotency && existingIdempotency.responseStatus === 'completed') {
      // Return cached response for duplicate request
      console.log('[Purchase API] Returning cached response for idempotent request');
      return NextResponse.json({
        purchase: existingIdempotency.responseData?.purchase,
        payment: existingIdempotency.responseData?.payment,
        idempotent: true,
      });
    }

    // Get request metadata for fraud prevention
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Perform fraud prevention checks
    console.log('[Purchase API] Performing fraud prevention checks...');
    const fraudCheck = await FraudPreventionService.performFraudChecks({
      userId: agentId,
      amount: parseFloat(leadData.lead_price.toString()),
      ipAddress,
      userAgent,
    });

    if (!fraudCheck.passed) {
      console.log('[Purchase API] Fraud check failed:', {
        riskScore: fraudCheck.riskScore,
        checks: fraudCheck.checks,
      });
      return NextResponse.json(
        { 
          error: 'Payment blocked by fraud prevention system',
          riskScore: fraudCheck.riskScore,
          reason: fraudCheck.checks.find(c => !c.passed)?.reason,
        },
        { status: 403 }
      );
    }

    // Create payment record (status: pending)
    console.log('[Purchase API] Creating payment record...');
    const payment = await PaymentService.createPayment({
      purchaseId: '', // Will be set after purchase is created
      userId: agentId,
      amount: parseFloat(leadData.lead_price.toString()),
      currency: 'USD',
      idempotencyKey: finalIdempotencyKey,
      ipAddress,
      userAgent,
      metadata: {
        leadId,
        fraudCheckLogId: fraudCheck.logId,
      },
    });

    // Store idempotency record (status: pending)
    await IdempotencyService.storeIdempotency({
      idempotencyKey: finalIdempotencyKey,
      userId: agentId,
      requestBody: { leadId, agentId },
      paymentId: payment.id,
      responseStatus: 'pending',
    });

    try {
      // Process purchase
      console.log('[Purchase API] Calling MarketplaceService.purchaseLead...');
      const purchase = await MarketplaceService.purchaseLead(leadId, agentId);

      // Update payment with purchase ID (we need to update the purchase_id column)
      // Since PaymentService doesn't have a method to update purchase_id, we'll do it directly
      const { query: updateQuery } = await import('@/lib/aws/lambda-database');
      await updateQuery(
        'UPDATE payments SET purchase_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [purchase.id, PaymentStatus.PROCESSING, payment.id]
      );

      // PLACEHOLDER: Process payment with gateway
      // TODO: Replace with actual payment gateway integration
      console.log('[Purchase API] PLACEHOLDER: Processing payment with gateway...');
      const gatewayResult = await PaymentService.processPaymentWithGateway(
        payment.id,
        PaymentMethod.STRIPE, // Placeholder
        {} // Payment data
      );

      if (gatewayResult.success && gatewayResult.paymentIntentId) {
        // Payment successful
        await PaymentService.markAsCompleted(
          payment.id,
          gatewayResult.paymentIntentId,
          gatewayResult
        );

        // Update idempotency record
        await IdempotencyService.updateIdempotencyResult(
          finalIdempotencyKey,
          payment.id,
          'completed',
          { purchase, payment }
        );

        console.log('[Purchase API] Purchase and payment successful:', { 
          purchaseId: purchase?.id,
          paymentId: payment.id 
        });
        
        return NextResponse.json({ 
          purchase,
          payment: {
            id: payment.id,
            status: PaymentStatus.COMPLETED,
            amount: payment.amount,
            currency: payment.currency,
          },
        });
      } else {
        // Payment gateway not integrated - mark as pending for manual review
        console.log('[Purchase API] Payment gateway not integrated, marking as pending');
        
        // For now, we'll mark purchase as successful but payment as pending
        // This allows the system to work while payment gateway is being integrated
        await PaymentService.updatePaymentStatus({
          paymentId: payment.id,
          status: PaymentStatus.PENDING,
          failureReason: 'Payment gateway not yet integrated',
        });

        return NextResponse.json({ 
          purchase,
          payment: {
            id: payment.id,
            status: PaymentStatus.PENDING,
            amount: payment.amount,
            currency: payment.currency,
            message: 'Payment gateway integration pending. Purchase recorded.',
          },
          warning: 'Payment gateway not yet integrated',
        });
      }
    } catch (purchaseError: any) {
      // Purchase failed - mark payment as failed
      const errorMessage = purchaseError instanceof Error ? purchaseError.message : String(purchaseError);
      
      await PaymentService.markAsFailed(
        payment.id,
        `Purchase failed: ${errorMessage}`,
        'PURCHASE_FAILED'
      );

      // Update idempotency record
      await IdempotencyService.updateIdempotencyResult(
        finalIdempotencyKey,
        payment.id,
        'failed',
        { error: errorMessage }
      );

      throw purchaseError; // Re-throw to be handled by outer catch
    }
  } catch (error) {
    console.error('[Purchase API] Error caught:', {
      error,
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
      originalError: (error as any)?.originalError,
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    
    // Extract error message - check multiple sources
    let errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code;
    const originalError = (error as any)?.originalError;
    
    // If there's an originalError, try to get message from there
    if (originalError) {
      if (originalError.message) {
        errorMessage = originalError.message;
      } else if (originalError.error) {
        errorMessage = originalError.error;
      }
    }
    
    const lowerErrorMessage = errorMessage.toLowerCase();
    
    console.log('[Purchase API] Error message analysis:', {
      originalMessage: errorMessage,
      lowerMessage: lowerErrorMessage,
      errorCode: errorCode,
      includesAlreadyPurchased: lowerErrorMessage.includes('already purchased') || errorCode === '23505',
      includesNotFound: lowerErrorMessage.includes('not found') || lowerErrorMessage.includes('unavailable'),
      includesExpired: lowerErrorMessage.includes('expired'),
      includesUniqueConstraint: lowerErrorMessage.includes('unique') || lowerErrorMessage.includes('duplicate'),
    });
    
    // Handle specific business logic errors with appropriate status codes
    // Check for unique constraint violation (PostgreSQL error code 23505)
    if (lowerErrorMessage.includes('already purchased') || 
        errorCode === '23505' ||
        lowerErrorMessage.includes('unique constraint') ||
        lowerErrorMessage.includes('duplicate key')) {
      console.log('[Purchase API] Returning 409 Conflict - already purchased');
      return NextResponse.json(
        { error: 'You have already purchased this lead' },
        { status: 409 } // Conflict - resource already exists
      );
    }
    
    if (lowerErrorMessage.includes('not found') || lowerErrorMessage.includes('unavailable')) {
      console.log('[Purchase API] Returning 404 Not Found');
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 } // Not Found
      );
    }
    
    if (lowerErrorMessage.includes('expired')) {
      console.log('[Purchase API] Returning 410 Gone');
      return NextResponse.json(
        { error: errorMessage },
        { status: 410 } // Gone - resource no longer available
      );
    }
    
    // Default to 500 for unexpected errors
    console.log('[Purchase API] Returning 500 Internal Server Error');
    console.log('[Purchase API] Full error details for debugging:', {
      error,
      errorMessage,
      errorCode,
      originalError,
      errorType: error?.constructor?.name,
    });
    
    // Return the actual error message in development/staging for debugging
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.NEXT_PUBLIC_ENV === 'development' ||
                         process.env.AMPLIFY_ENV === 'dev';
    
    return NextResponse.json(
      { 
        error: isDevelopment ? errorMessage : 'Failed to purchase lead',
        details: isDevelopment ? {
          message: errorMessage,
          code: errorCode,
          type: error?.constructor?.name,
        } : undefined
      },
      { status: 500 }
    );
  }
}

