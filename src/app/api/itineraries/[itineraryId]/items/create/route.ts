import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/itineraries/[itineraryId]/items/create
 * Create a new itinerary item
 * Body: { dayId?, packageType, packageId, operatorId, packageTitle, packageImageUrl?, configuration?, unitPrice, quantity, displayOrder?, notes? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const {
      dayId = null,
      packageType,
      packageId,
      operatorId,
      packageTitle,
      packageImageUrl = null,
      configuration = null,
      unitPrice,
      quantity,
      displayOrder = 0,
      notes = null,
    } = await request.json();

    if (!packageType || !packageId || !operatorId || !packageTitle || unitPrice === undefined || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: packageType, packageId, operatorId, packageTitle, unitPrice, quantity' },
        { status: 400 }
      );
    }

    const totalPrice = unitPrice * quantity;

    // Get current max display_order for this itinerary
    const maxOrderResult = await query<{ max_order: number }>(
      `SELECT COALESCE(MAX(display_order), 0) as max_order 
       FROM itinerary_items 
       WHERE itinerary_id::text = $1`,
      [itineraryId]
    );

    const finalDisplayOrder = displayOrder || (maxOrderResult.rows[0]?.max_order || 0) + 1;

    // Insert itinerary item
    const insertResult = await query<{ id: string }>(
      `INSERT INTO itinerary_items (
        itinerary_id, day_id, package_type, package_id, operator_id,
        package_title, package_image_url, configuration, unit_price,
        quantity, total_price, display_order, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        itineraryId,
        dayId,
        packageType,
        packageId,
        operatorId,
        packageTitle,
        packageImageUrl,
        configuration ? JSON.stringify(configuration) : null,
        unitPrice,
        quantity,
        totalPrice,
        finalDisplayOrder,
        notes,
      ]
    );

    if (!insertResult.rows || insertResult.rows.length === 0 || !insertResult.rows[0]) {
      return NextResponse.json(
        { error: 'Failed to create itinerary item' },
        { status: 500 }
      );
    }

    const createdItem = insertResult.rows[0];
    return NextResponse.json({
      item: { id: createdItem.id },
      created: true,
    });
  } catch (error) {
    console.error('Error creating itinerary item:', error);
    return NextResponse.json(
      { error: 'Failed to create itinerary item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

