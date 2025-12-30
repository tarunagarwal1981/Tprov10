import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Payment {
  id: string;
  itinerary_id: string;
  amount: number;
  payment_type: 'deposit' | 'partial' | 'full' | 'refund';
  payment_method: string | null;
  payment_reference: string | null;
  received_at: string | null;
  received_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/itineraries/[itineraryId]/payments
 * Get all payments for an itinerary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify itinerary ownership
    const itinerary = await queryOne<{ agent_id: string }>(
      'SELECT agent_id FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (!itinerary || itinerary.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch payments
    const paymentsResult = await query<Payment>(
      'SELECT * FROM itinerary_payments WHERE itinerary_id = $1 ORDER BY received_at DESC, created_at DESC',
      [itineraryId]
    );

    return NextResponse.json({ payments: paymentsResult.rows });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/itineraries/[itineraryId]/payments
 * Record a new payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify itinerary ownership
    const itinerary = await queryOne<{ agent_id: string }>(
      'SELECT agent_id FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (!itinerary || itinerary.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      amount,
      payment_type,
      payment_method,
      payment_reference,
      received_at,
      notes,
    } = body;

    if (!amount || !payment_type) {
      return NextResponse.json(
        { error: 'amount and payment_type are required' },
        { status: 400 }
      );
    }

    // Create payment record
    const paymentResult = await query<Payment>(
      `INSERT INTO itinerary_payments (
        itinerary_id, amount, payment_type, payment_method,
        payment_reference, received_at, received_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        itineraryId,
        amount,
        payment_type,
        payment_method || null,
        payment_reference || null,
        received_at ? new Date(received_at).toISOString() : new Date().toISOString(),
        userId,
        notes || null,
      ]
    );

    // Auto-confirm itinerary on ANY payment (partial or full)
    // Check if itinerary is already confirmed/locked
    const itineraryCheck = await queryOne<{
      id: string;
      is_locked: boolean;
      confirmed_at: string | null;
    }>(
      'SELECT id, is_locked, confirmed_at FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (itineraryCheck && !itineraryCheck.is_locked && !itineraryCheck.confirmed_at) {
      // Confirm and lock the itinerary
      await query(
        `UPDATE itineraries 
         SET confirmed_at = NOW(), 
             confirmed_by = $2, 
             is_locked = TRUE, 
             locked_at = NOW(), 
             locked_by = $2,
             status = 'confirmed',
             updated_at = NOW()
         WHERE id = $1`,
        [itineraryId, userId]
      );
    }

    return NextResponse.json({ payment: paymentResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

