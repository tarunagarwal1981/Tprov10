import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operator/dashboard/stats?operatorId=xxx
 * Get operator dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const operatorId = searchParams.get('operatorId');

    if (!operatorId) {
      return NextResponse.json(
        { error: 'operatorId is required' },
        { status: 400 }
      );
    }

    // Fetch all package types for this operator
    const [activityPackages, multiCityPackages, transferPackages, travelAgents] = await Promise.all([
      query<any>(
        `SELECT id, status, base_price 
         FROM activity_packages 
         WHERE operator_id::text = $1`,
        [operatorId]
      ),
      query<any>(
        `SELECT id, status, base_price 
         FROM multi_city_packages 
         WHERE operator_id::text = $1`,
        [operatorId]
      ),
      query<any>(
        `SELECT id, status, base_price 
         FROM transfer_packages 
         WHERE operator_id::text = $1`,
        [operatorId]
      ),
      query<any>(
        `SELECT id 
         FROM users 
         WHERE role = 'TRAVEL_AGENT'`
      ),
    ]);

    const allPackages = [
      ...(activityPackages.rows || []),
      ...(multiCityPackages.rows || []),
      ...(transferPackages.rows || []),
    ];

    const totalPackages = allPackages.length;
    const activePackages = allPackages.filter((p: any) => p.status === 'published').length;
    const totalValue = allPackages.reduce((sum: number, p: any) => sum + (p.base_price || 0), 0);
    const travelAgentsCount = travelAgents.rows?.length || 0;

    return NextResponse.json({
      stats: {
        totalPackages,
        activePackages,
        totalValue,
        travelAgentsCount,
      },
      packages: {
        activity: activityPackages.rows?.length || 0,
        multiCity: multiCityPackages.rows?.length || 0,
        transfer: transferPackages.rows?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching operator dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

