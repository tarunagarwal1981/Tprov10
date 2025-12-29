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
  console.log('[Create Item] ===== POST /api/itineraries/[itineraryId]/items/create START =====');
  try {
    const { itineraryId } = await params;
    console.log('[Create Item] Extracted itineraryId from params:', itineraryId);
    
    // Verify itinerary exists before proceeding
    const itineraryCheck = await query<{ id: string }>(
      `SELECT id FROM itineraries WHERE id = $1::uuid LIMIT 1`,
      [itineraryId]
    );
    
    if (!itineraryCheck.rows || itineraryCheck.rows.length === 0) {
      console.error('[Create Item] Itinerary not found:', itineraryId);
      return NextResponse.json(
        { error: 'Itinerary not found', details: `Itinerary with ID ${itineraryId} does not exist` },
        { status: 404 }
      );
    }
    
    console.log('[Create Item] Itinerary exists, proceeding with item creation');
    
    const body = await request.json();
    console.log('[Create Item] Request body received');
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
    } = body;

    console.log('[Create Item] Request body:', JSON.stringify(body, null, 2));
    console.log('[Create Item] Extracted values:', { packageType, packageId, operatorId, packageTitle, unitPrice, quantity });

    // Validate required fields (check for empty strings too)
    if (!packageType || !packageId || !operatorId || !packageTitle || unitPrice === undefined || quantity === undefined) {
      console.error('[Create Item] Missing required fields:', { 
        packageType: packageType || 'MISSING', 
        packageId: packageId || 'MISSING', 
        operatorId: operatorId || 'MISSING', 
        packageTitle: packageTitle || 'MISSING', 
        unitPrice, 
        quantity 
      });
      return NextResponse.json(
        { error: 'Missing required fields: packageType, packageId, operatorId, packageTitle, unitPrice, quantity' },
        { status: 400 }
      );
    }

    // Validate UUID format for UUID fields
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(itineraryId)) {
      console.error('[Create Item] Invalid itineraryId format:', itineraryId);
      return NextResponse.json(
        { error: 'Invalid itinerary ID format' },
        { status: 400 }
      );
    }
    if (!uuidRegex.test(packageId)) {
      console.error('[Create Item] Invalid packageId format:', packageId);
      return NextResponse.json(
        { error: 'Invalid package ID format' },
        { status: 400 }
      );
    }
    if (typeof operatorId !== 'string' || operatorId.trim() === '' || !uuidRegex.test(operatorId)) {
      console.error('[Create Item] Invalid operatorId:', { operatorId, type: typeof operatorId, isEmpty: operatorId === '' });
      return NextResponse.json(
        { error: 'Invalid operator ID format or empty', details: `operatorId: ${operatorId}` },
        { status: 400 }
      );
    }
    if (dayId && (typeof dayId !== 'string' || !uuidRegex.test(dayId))) {
      console.error('[Create Item] Invalid dayId format:', dayId);
      return NextResponse.json(
        { error: 'Invalid day ID format' },
        { status: 400 }
      );
    }

    // Note: No need to verify operator exists - the database foreign key constraint will enforce it
    // The operatorId comes from the activity/transfer package, and the FK constraint ensures it exists

    const totalPrice = unitPrice * quantity;

    // Get current max display_order for this itinerary
    const maxOrderResult = await query<{ max_order: number }>(
      `SELECT COALESCE(MAX(display_order), 0) as max_order 
       FROM itinerary_items 
       WHERE itinerary_id = $1::uuid`,
      [itineraryId]
    );

    const finalDisplayOrder = displayOrder || (maxOrderResult.rows[0]?.max_order || 0) + 1;

    // Insert itinerary item
    // Note: configuration is JSONB NOT NULL, so use empty object if null
    // PostgreSQL will automatically cast JSON string to JSONB
    const configValue = configuration ? JSON.stringify(configuration) : '{}';
    
    const insertValues = [
        itineraryId,
        dayId || null, // Use null if dayId is not provided
        packageType,
        packageId,
        operatorId,
        packageTitle,
        packageImageUrl || null, // Allow null for image URL
        configValue,
        unitPrice,
        quantity,
        totalPrice,
        finalDisplayOrder,
        notes || null, // Allow null for notes
    ];
    
    console.log('[Create Item] Prepared insert values:', {
      values: insertValues.map((v, i) => ({ index: i + 1, value: typeof v === 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v, type: typeof v })),
    });

    console.log('[Create Item] Inserting with values:', { 
      itineraryId, 
      dayId: dayId || 'NULL', 
      packageType, 
      packageId, 
      operatorId, 
      packageTitle, 
      unitPrice, 
      quantity, 
      totalPrice 
    });

    let insertResult;
    let queryParams: any[] = [];
    try {
      // Generate UUID explicitly for id column (in case default isn't working)
      // Handle null dayId - use conditional query since PostgreSQL can't cast NULL to UUID
      // Use ::uuid syntax which PostgreSQL handles better than CAST() for parameterized queries
      const insertQuery = dayId
        ? `INSERT INTO itinerary_items (
            id, itinerary_id, day_id, package_type, package_id, operator_id,
            package_title, package_image_url, configuration, unit_price,
            quantity, total_price, display_order, notes
          ) VALUES (
            gen_random_uuid(), 
            $1::uuid, 
            $2::uuid, 
            $3, 
            $4::uuid, 
            $5::uuid, 
            $6, 
            $7, 
            $8::jsonb, 
            $9, 
            $10, 
            $11, 
            $12, 
            $13
          )
          RETURNING *`
        : `INSERT INTO itinerary_items (
            id, itinerary_id, day_id, package_type, package_id, operator_id,
            package_title, package_image_url, configuration, unit_price,
            quantity, total_price, display_order, notes
          ) VALUES (
            gen_random_uuid(), 
            $1::uuid, 
            NULL, 
            $2, 
            $3::uuid, 
            $4::uuid, 
            $5, 
            $6, 
            $7::jsonb, 
            $8, 
            $9, 
            $10, 
            $11, 
            $12
          )
          RETURNING *`;
      
      // Adjust parameters based on whether dayId is provided
      queryParams = dayId 
        ? insertValues 
        : [
            itineraryId,
            packageType,
            packageId,
            operatorId,
            packageTitle,
            packageImageUrl || null,
            configValue,
            unitPrice,
            quantity,
            totalPrice,
            finalDisplayOrder,
            notes || null,
          ];
      
      console.log('[Create Item] Using query', dayId ? 'with dayId' : 'without dayId (NULL)');
      console.log('[Create Item] Query params count:', queryParams.length);
      console.log('[Create Item] Query params details:', queryParams.map((p, i) => ({
        index: i + 1,
        value: typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p,
        type: typeof p,
        isNull: p === null,
        isUndefined: p === undefined,
      })));
      console.log('[Create Item] SQL Query:', insertQuery.substring(0, 200) + '...');
      
      insertResult = await query<any>(
        insertQuery,
        queryParams
      );

      const firstRow = insertResult.rows?.[0];
      const allKeys = firstRow ? Object.keys(firstRow) : [];
      
      console.log('[Create Item] Insert result:', {
        hasRows: !!insertResult.rows,
        rowsLength: insertResult.rows?.length,
        firstRow: firstRow,
        allKeys: allKeys,
        hasIdKey: allKeys.includes('id'),
        hasIDKey: allKeys.includes('ID'),
        firstRowEntries: firstRow ? Object.entries(firstRow).map(([k, v]) => [k, typeof v === 'string' && v.length > 50 ? v.substring(0, 50) + '...' : v]) : [],
        fullResult: JSON.stringify(insertResult, null, 2),
      });
    } catch (dbError) {
      const errorDetails: any = {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        name: dbError instanceof Error ? dbError.name : undefined,
        dayId: dayId || 'NULL',
        itineraryId,
        packageId,
        operatorId,
        packageType,
        hasDayId: !!dayId,
        queryParams: queryParams.map((v, i) => ({ 
          index: i + 1, 
          value: v === null ? 'NULL' : (typeof v === 'string' && v.length > 50 ? v.substring(0, 50) + '...' : v), 
          type: typeof v,
          isNull: v === null,
          isUndefined: v === undefined,
        })),
      };
      
      // Try to extract more details from the error
      if (dbError instanceof Error) {
        const errorStr = dbError.toString();
        errorDetails.fullErrorString = errorStr;
        
        // Check for specific PostgreSQL error patterns
        if (errorStr.includes('operator does not exist')) {
          errorDetails.errorType = 'UUID_TYPE_MISMATCH';
          errorDetails.suggestion = 'Parameter type mismatch - ensure all UUID parameters are valid UUID strings';
        }
        if (errorStr.includes('foreign key')) {
          errorDetails.errorType = 'FOREIGN_KEY_VIOLATION';
        }
        if (errorStr.includes('not null')) {
          errorDetails.errorType = 'NOT_NULL_VIOLATION';
        }
      }
      
      console.error('[Create Item] Database error during INSERT:', errorDetails);
      
      // Return more detailed error to help debug
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      return NextResponse.json(
        { 
          error: 'Failed to create itinerary item', 
          details: errorMessage,
          debug: {
            dayId: dayId || null,
            itineraryId,
            packageType,
            hasDayId: !!dayId,
            operatorId,
            packageId,
          }
        },
        { status: 500 }
      );
    }

    if (!insertResult || !insertResult.rows || insertResult.rows.length === 0) {
      console.error('[Create Item] Insert result missing rows:', { 
        hasResult: !!insertResult,
        hasRows: !!insertResult?.rows,
        rowsLength: insertResult?.rows?.length,
        fullResult: JSON.stringify(insertResult, null, 2),
      });
      return NextResponse.json(
        { error: 'Failed to create itinerary item: ID not returned', details: 'No rows returned from INSERT' },
        { status: 500 }
      );
    }

    const createdItem = insertResult.rows[0];
    
    if (!createdItem) {
      console.error('[Create Item] Created item is null/undefined:', { 
        rows: insertResult.rows,
        firstRow: insertResult.rows[0],
      });
      return NextResponse.json(
        { error: 'Failed to create itinerary item: ID not returned', details: 'First row is null' },
        { status: 500 }
      );
    }
    
    // Handle case-insensitive ID access (PostgreSQL might return 'ID' or 'id')
    // Also check all possible variations
    const itemId = createdItem.id 
      || (createdItem as any).ID 
      || (createdItem as any).Id 
      || (createdItem as any).iD
      || (createdItem as any)['id']
      || (createdItem as any)['ID'];
    
    // If still not found, try to get it from the first key-value pair if it looks like an ID
    let fallbackId = null;
    if (!itemId && createdItem) {
      const entries = Object.entries(createdItem);
      // Look for a UUID-like value
      for (const [key, value] of entries) {
        if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
          // This looks like a UUID, might be the id
          if (key.toLowerCase().includes('id') || entries.length === 1) {
            fallbackId = value;
            console.log('[Create Item] Found ID-like value in key:', key, 'value:', value);
            break;
          }
        }
      }
    }
    
    const finalId = itemId || fallbackId;
    
    if (!finalId) {
      console.error('[Create Item] Created item missing ID:', { 
        createdItem,
        keys: Object.keys(createdItem),
        allValues: createdItem,
        fullRow: JSON.stringify(createdItem, null, 2),
      });
      return NextResponse.json(
        { error: 'Failed to create itinerary item: ID not returned', details: `ID field missing from returned row. Available keys: ${Object.keys(createdItem).join(', ')}` },
        { status: 500 }
      );
    }

    console.log('[Create Item] ✅ Successfully created item with ID:', finalId);

    // Return the full created item (not just ID) so frontend can use total_price, operator_id, etc.
    return NextResponse.json({
      item: createdItem,
      created: true,
    });
  } catch (error) {
    console.error('[Create Item] ===== TOP-LEVEL ERROR =====');
    console.error('[Create Item] Error creating itinerary item:', error);
    console.error('[Create Item] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[Create Item] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[Create Item] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[Create Item] ===== END TOP-LEVEL ERROR =====');
    return NextResponse.json(
      { 
        error: 'Failed to create itinerary item', 
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 }
    );
  }
}

