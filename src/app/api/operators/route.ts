import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operators
 * Get all tour operators (users with TOUR_OPERATOR, ADMIN, or SUPER_ADMIN role)
 * Query params:
 *   - ids: comma-separated list of operator IDs to fetch (optional, for batch fetching)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');
    
    // Extract full operator details from profile JSONB field
    let queryString = `SELECT 
      id, 
      name, 
      email, 
      phone,
      profile->>'companyName' as company_name,
      profile->>'phoneNumber' as phone_number,
      profile->>'websiteUrl' as website_url,
      profile->>'businessAddress' as business_address,
      profile->>'whatsapp' as whatsapp
    FROM users 
    WHERE role IN ('TOUR_OPERATOR', 'ADMIN', 'SUPER_ADMIN')`;
    let params: any[] = [];
    
    // If specific IDs are requested, filter by them
    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      if (ids.length > 0) {
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        queryString += ` AND id::text IN (${placeholders})`;
        params = ids;
      }
    }
    
    queryString += ' ORDER BY name ASC';
    
    const result = await query<{
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      company_name: string | null;
      phone_number: string | null;
      website_url: string | null;
      business_address: string | null;
      whatsapp: string | null;
    }>(queryString, params);

    const operators = result.rows.map((op) => ({
      id: op.id,
      name: op.company_name || op.name || 'Unknown Operator',
      email: op.email || null,
      phone: op.phone || op.phone_number || null,
      website: op.website_url || null,
      address: op.business_address || null,
      whatsapp: op.whatsapp || null,
    }));

    return NextResponse.json({ operators });
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operators', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

