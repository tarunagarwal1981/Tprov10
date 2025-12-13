import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/delete-queries
 * Delete all existing queries from itinerary_queries table
 * This prevents conflicts with the new flow where query form appears after card clicks
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Count existing queries
    const countResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM itinerary_queries'
    );
    const count = countResult.rows?.[0]?.count || 0;

    if (count === 0) {
      return NextResponse.json({
        success: true,
        message: 'No queries found. Nothing to delete.',
        deleted: 0,
        remaining: 0,
      });
    }

    // Step 2: Delete all queries
    await query('DELETE FROM itinerary_queries');

    // Step 3: Verify deletion
    const verifyResult = await query<{ remaining_queries: number }>(
      'SELECT COUNT(*) as remaining_queries FROM itinerary_queries'
    );
    const remaining = verifyResult.rows?.[0]?.remaining_queries || 0;

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${count} queries`,
      deleted: count,
      remaining,
    });
  } catch (error) {
    console.error('Error deleting queries:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete queries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/delete-queries
 * Get count of existing queries (for verification)
 */
export async function GET(request: NextRequest) {
  try {
    const countResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM itinerary_queries'
    );
    const count = countResult.rows?.[0]?.count || 0;

    return NextResponse.json({
      count,
      message: `Found ${count} queries in itinerary_queries table`,
    });
  } catch (error) {
    console.error('Error counting queries:', error);
    return NextResponse.json(
      {
        error: 'Failed to count queries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
