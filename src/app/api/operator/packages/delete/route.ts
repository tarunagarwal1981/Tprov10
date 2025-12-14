import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DELETE /api/operator/packages/delete
 * Delete a package (activity, transfer, or multi-city) and all related data
 * Body: { packageId, packageType }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { packageId, packageType } = await request.json();

    if (!packageId || !packageType) {
      return NextResponse.json(
        { error: 'packageId and packageType are required' },
        { status: 400 }
      );
    }

    let tableName: string;

    // Determine table based on package type
    switch (packageType) {
      case 'Activity':
        tableName = 'activity_packages';
        break;
      case 'Transfer':
        tableName = 'transfer_packages';
        break;
      case 'Multi-City':
        tableName = 'multi_city_packages';
        break;
      case 'Multi-City Hotel':
        tableName = 'multi_city_hotel_packages';
        break;
      case 'Fixed Departure Flight':
        tableName = 'fixed_departure_flight_packages';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid package type' },
          { status: 400 }
        );
    }

    // Delete package (cascade will handle related data if foreign keys are set up)
    await query(
      `DELETE FROM ${tableName} WHERE id::text = $1`,
      [packageId]
    );

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Failed to delete package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


