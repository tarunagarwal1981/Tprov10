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
  console.log('[Create Item] Timestamp:', new Date().toISOString());
  try {
    const { itineraryId } = await params;
    console.log('[Create Item] Extracted itineraryId from params:', itineraryId);
    console.log('[Create Item] Request URL:', request.url);
    
    // Verify itinerary exists before proceeding
    const itineraryCheck = await query<{ id: string }>(
      `SELECT id FROM itineraries WHERE id::text = $1 LIMIT 1`,
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
    
    // Parse body with error handling
    console.log('[Create Item] Parsing request body...');
    let body;
    try {
      body = await request.json();
      console.log('[Create Item] Request body parsed successfully');
    } catch (parseError) {
      console.error('[Create Item] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError instanceof Error ? parseError.message : String(parseError) },
        { status: 400 }
      );
    }
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
    console.log('[Create Item] Request body keys:', Object.keys(body));
    console.log('[Create Item] Extracted values:', { 
      packageType, 
      packageId, 
      operatorId: operatorId || 'MISSING/UNDEFINED', 
      packageTitle, 
      unitPrice, 
      quantity 
    });
    console.log('[Create Item] Value types:', {
      dayId_type: typeof dayId,
      packageType_type: typeof packageType,
      packageId_type: typeof packageId,
      operatorId_type: typeof operatorId,
      packageTitle_type: typeof packageTitle,
      unitPrice_type: typeof unitPrice,
      quantity_type: typeof quantity,
    });

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
      console.error('[Create Item] Invalid operatorId:', { 
        operatorId, 
        type: typeof operatorId, 
        isEmpty: operatorId === '',
        isUndefined: operatorId === undefined,
        isNull: operatorId === null,
        isWhitespace: typeof operatorId === 'string' && operatorId.trim() === '',
        isValidUUID: typeof operatorId === 'string' ? uuidRegex.test(operatorId) : false,
        fullBody: JSON.stringify(body, null, 2),
      });
      return NextResponse.json(
        { error: 'Invalid operator ID format or empty', details: `operatorId: ${operatorId} (type: ${typeof operatorId})` },
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

    // Verify operator_id exists in users table
    // Both users.id and operator_id are now UUID type - direct comparison
    console.log('[Create Item] ===== OPERATOR VALIDATION START =====');
    console.log('[Create Item] operatorId:', {
      value: operatorId,
      type: typeof operatorId,
      isString: typeof operatorId === 'string',
      length: typeof operatorId === 'string' ? operatorId.length : 'N/A',
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(operatorId))
    });
    
    try {
      const validationQuery = `SELECT id FROM users WHERE id = $1 LIMIT 1`;
      console.log('[Create Item] Validation query:', validationQuery);
      console.log('[Create Item] Validation query params:', [operatorId]);
      console.log('[Create Item] Executing validation query...');
      
      const operatorCheck = await query<{ id: string }>(
        validationQuery,
        [operatorId]
      );
      
      console.log('[Create Item] Validation query result:', {
        hasRows: !!operatorCheck.rows,
        rowCount: operatorCheck.rows?.length || 0,
        firstRow: operatorCheck.rows?.[0] || null
      });
      
      if (!operatorCheck.rows || operatorCheck.rows.length === 0) {
        console.error('[Create Item] ❌ Operator not found in users table:', operatorId);
        console.log('[Create Item] ===== OPERATOR VALIDATION END (NOT FOUND) =====');
        return NextResponse.json(
          { 
            error: 'Invalid operator',
            details: `The operator with ID ${operatorId} does not exist in the system`,
            operator_id: operatorId,
            suggestion: 'Please contact support to add this operator to the system'
          },
          { status: 400 }
        );
      }
      console.log('[Create Item] ✅ Operator verified in users table');
      console.log('[Create Item] Operator details:', operatorCheck.rows[0]);
      console.log('[Create Item] ===== OPERATOR VALIDATION END (SUCCESS) =====');
    } catch (operatorCheckError: any) {
      console.error('[Create Item] ===== OPERATOR VALIDATION ERROR =====');
      console.error('[Create Item] Error type:', typeof operatorCheckError);
      console.error('[Create Item] Error message:', operatorCheckError?.message);
      console.error('[Create Item] Error stack:', operatorCheckError?.stack);
      console.error('[Create Item] Error code:', operatorCheckError?.code);
      console.error('[Create Item] Error detail:', operatorCheckError?.detail);
      console.error('[Create Item] Full error object:', JSON.stringify(operatorCheckError, Object.getOwnPropertyNames(operatorCheckError)));
      console.error('[Create Item] ===== OPERATOR VALIDATION ERROR END =====');
      return NextResponse.json(
        { 
          error: 'Failed to validate operator',
          details: 'Unable to verify operator in the system',
          operator_id: operatorId,
          errorMessage: operatorCheckError?.message,
          errorCode: operatorCheckError?.code
        },
        { status: 500 }
      );
    }

    const totalPrice = unitPrice * quantity;

    // Get current max display_order for this itinerary
    const maxOrderResult = await query<{ max_order: number }>(
      `SELECT COALESCE(MAX(display_order), 0) as max_order 
       FROM itinerary_items 
       WHERE itinerary_id = $1`,
      [itineraryId]
    );

    const finalDisplayOrder = displayOrder || (maxOrderResult.rows[0]?.max_order || 0) + 1;

    // Insert itinerary item
    // Note: configuration is JSONB NOT NULL, so use empty object if null
    // PostgreSQL will automatically cast JSON string to JSONB
    const configValue = configuration ? JSON.stringify(configuration) : '{}';
    
    // operatorId is already a UUID string, use directly
    const insertValues = [
        itineraryId,
        dayId || null, // Use null if dayId is not provided
        packageType,
        packageId,
        operatorId, // UUID type
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
      // Use CAST() syntax for UUID parameters - this works better with Lambda database service
      // Note: itinerary_id, day_id, package_id are TEXT columns (not UUID)
      // Only operator_id is UUID and needs casting
      const insertQuery = dayId
        ? `INSERT INTO itinerary_items (
            id, itinerary_id, day_id, package_type, package_id, operator_id,
            package_title, package_image_url, configuration, unit_price,
            quantity, total_price, display_order, notes
          ) VALUES (
            gen_random_uuid(), 
            $1::text, 
            $2::text, 
            $3::text, 
            $4::text, 
            CAST($5 AS uuid), 
            $6::text, 
            $7::text, 
            $8::jsonb, 
            $9::numeric, 
            $10::integer, 
            $11::numeric, 
            $12::integer, 
            $13::text
          )
          RETURNING *`
        : `INSERT INTO itinerary_items (
            id, itinerary_id, day_id, package_type, package_id, operator_id,
            package_title, package_image_url, configuration, unit_price,
            quantity, total_price, display_order, notes
          ) VALUES (
            gen_random_uuid(), 
            $1::text, 
            NULL, 
            $2::text, 
            $3::text, 
            CAST($4 AS uuid), 
            $5::text, 
            $6::text, 
            $7::jsonb, 
            $8::numeric, 
            $9::integer, 
            $10::numeric, 
            $11::integer, 
            $12::text
          )
          RETURNING *`;
      
      // Adjust parameters based on whether dayId is provided
      queryParams = dayId 
        ? insertValues 
        : [
            itineraryId,
            packageType,
            packageId,
            operatorId, // UUID type
            packageTitle,
            packageImageUrl || null,
            configValue,
            unitPrice,
            quantity,
            totalPrice,
            finalDisplayOrder,
            notes || null,
          ];
      
      console.log('[Create Item] ===== INSERT QUERY PREPARATION =====');
      console.log('[Create Item] Using query', dayId ? 'with dayId' : 'without dayId (NULL)');
      console.log('[Create Item] Query params count:', queryParams.length);
      console.log('[Create Item] Full SQL Query:');
      console.log(insertQuery);
      console.log('[Create Item] Query params details:');
      queryParams.forEach((p, i) => {
        const paramValue = p === null ? 'NULL' : (typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p);
        console.log(`  [${i + 1}] ${paramValue} (${typeof p}${p === null ? ', NULL' : ''}${typeof p === 'string' ? `, length: ${p.length}` : ''})`);
      });
      
      // Log operatorId position (it's at index 4 when dayId exists, or index 3 when it doesn't)
      const operatorIdIndex = dayId ? 4 : 3;
      console.log('[Create Item] OperatorId parameter details:', {
        parameterIndex: operatorIdIndex + 1,
        sqlPosition: dayId ? '$5' : '$4',
        value: queryParams[operatorIdIndex],
        type: typeof queryParams[operatorIdIndex],
        isString: typeof queryParams[operatorIdIndex] === 'string',
        stringValue: String(queryParams[operatorIdIndex]),
        stringLength: typeof queryParams[operatorIdIndex] === 'string' ? queryParams[operatorIdIndex].length : 'N/A',
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(queryParams[operatorIdIndex]))
      });
      
      console.log('[Create Item] About to execute INSERT query...');
      console.log('[Create Item] ===== EXECUTING INSERT =====');
      
      insertResult = await query<any>(
        insertQuery,
        queryParams
      );
      
      console.log('[Create Item] ===== INSERT QUERY COMPLETED =====');
      
      console.log('[Create Item] INSERT query executed successfully');
      console.log('[Create Item] Insert result received:', {
        hasResult: !!insertResult,
        hasRows: !!insertResult?.rows,
        rowsLength: insertResult?.rows?.length,
      });

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
    } catch (dbError: any) {
      console.error('[Create Item] ===== DATABASE ERROR CAUGHT =====');
      console.error('[Create Item] Error object:', dbError);
      console.error('[Create Item] Error type:', typeof dbError);
      console.error('[Create Item] Is Error instance:', dbError instanceof Error);
      console.error('[Create Item] Error constructor:', dbError?.constructor?.name);
      console.error('[Create Item] Error name:', dbError?.name);
      console.error('[Create Item] Error message:', dbError?.message);
      console.error('[Create Item] Error code:', dbError?.code);
      console.error('[Create Item] Error detail:', dbError?.detail);
      console.error('[Create Item] Error hint:', dbError?.hint);
      console.error('[Create Item] Error constraint:', dbError?.constraint);
      console.error('[Create Item] Error table:', dbError?.table);
      console.error('[Create Item] Error column:', dbError?.column);
      console.error('[Create Item] Error position:', dbError?.position);
      console.error('[Create Item] Error internalPosition:', dbError?.internalPosition);
      console.error('[Create Item] Error internalQuery:', dbError?.internalQuery);
      console.error('[Create Item] Error where:', dbError?.where);
      console.error('[Create Item] Error schema:', dbError?.schema);
      console.error('[Create Item] Error dataType:', dbError?.dataType);
      console.error('[Create Item] Error stack:', dbError?.stack);
      console.error('[Create Item] Full error string:', String(dbError));
      console.error('[Create Item] Error JSON:', JSON.stringify(dbError, Object.getOwnPropertyNames(dbError)));
      
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
        errorDetails.errorCode = (dbError as any).code;
        errorDetails.errorDetail = (dbError as any).detail;
        errorDetails.errorConstraint = (dbError as any).constraint;
        errorDetails.errorHint = (dbError as any).hint;
        
        // Check for specific PostgreSQL error patterns
        if (errorStr.includes('operator does not exist')) {
          errorDetails.errorType = 'UUID_TYPE_MISMATCH';
          errorDetails.suggestion = 'Parameter type mismatch - ensure all UUID parameters are valid UUID strings';
        }
        if (errorStr.includes('foreign key') || errorStr.includes('violates foreign key constraint')) {
          errorDetails.errorType = 'FOREIGN_KEY_VIOLATION';
          // Check if it's related to operator_id
          if (errorStr.includes('operator_id') || errorDetails.errorConstraint?.includes('operator')) {
            errorDetails.errorType = 'OPERATOR_NOT_FOUND';
            errorDetails.userMessage = `The operator with ID ${operatorId} does not exist in the system`;
            errorDetails.suggestion = 'Please contact support to add this operator to the system';
          }
        }
        if (errorStr.includes('not null')) {
          errorDetails.errorType = 'NOT_NULL_VIOLATION';
        }
      }
      
      console.error('[Create Item] Full error details:', JSON.stringify(errorDetails, null, 2));
      console.error('[Create Item] ===== END DATABASE ERROR =====');
      
      // Return more detailed error to help debug
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      
      // Provide user-friendly error messages based on error type
      let userFriendlyError = 'Failed to create itinerary item';
      let userFriendlyDetails = errorMessage;
      
      if (errorDetails.errorType === 'OPERATOR_NOT_FOUND') {
        userFriendlyError = 'Invalid operator';
        userFriendlyDetails = errorDetails.userMessage || `The operator with ID ${operatorId} does not exist in the system`;
      } else if (errorDetails.errorType === 'FOREIGN_KEY_VIOLATION') {
        userFriendlyError = 'Data integrity error';
        userFriendlyDetails = 'The provided data references a record that does not exist. Please verify all IDs are correct.';
      } else if (errorDetails.errorType === 'NOT_NULL_VIOLATION') {
        userFriendlyError = 'Missing required data';
        userFriendlyDetails = 'Some required fields are missing. Please check your input.';
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyError,
          details: userFriendlyDetails,
          ...(errorDetails.suggestion && { suggestion: errorDetails.suggestion }),
          ...(errorDetails.errorType === 'OPERATOR_NOT_FOUND' && { operator_id: operatorId }),
          // Include debug info only in development
          ...(process.env.NODE_ENV === 'development' && {
            debug: {
              dayId: dayId || null,
              itineraryId,
              packageType,
              hasDayId: !!dayId,
              operatorId,
              packageId,
              errorType: errorDetails.errorType,
              errorCode: errorDetails.errorCode,
            }
          })
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

