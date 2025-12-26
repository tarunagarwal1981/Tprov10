import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

interface SubAgent {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  parent_agent_id: string | null;
  created_at: string;
}

/**
 * GET /api/agents/sub-agents
 * Get all sub-agents for the current agent
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch sub-agents (users with parent_agent_id = userId)
    const subAgentsResult = await query<SubAgent>(
      `SELECT id, email, name, phone, role, parent_agent_id, created_at 
       FROM users 
       WHERE parent_agent_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Get assignment counts for each sub-agent
    const subAgentsWithStats = await Promise.all(
      subAgentsResult.rows.map(async (subAgent) => {
        const assignmentsResult = await query<{ count: number }>(
          'SELECT COUNT(*) as count FROM sub_agent_assignments WHERE sub_agent_id = $1',
          [subAgent.id]
        );
        return {
          ...subAgent,
          assignedLeadsCount: parseInt(String(assignmentsResult.rows[0]?.count || '0'), 10),
        };
      })
    );

    return NextResponse.json({ subAgents: subAgentsWithStats });
  } catch (error) {
    console.error('Error fetching sub-agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sub-agents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/sub-agents
 * Create a new sub-agent
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, password, phone } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'email, name, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user in Cognito
    let cognitoUserId: string;
    try {
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: name },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
      });

      const createUserResponse = await cognitoClient.send(createUserCommand);
      cognitoUserId = createUserResponse.User?.Username || '';

      if (!cognitoUserId) {
        throw new Error('Failed to get user ID from Cognito');
      }

      // Set password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      });

      await cognitoClient.send(setPasswordCommand);
    } catch (cognitoError: any) {
      console.error('Error creating user in Cognito:', cognitoError);
      return NextResponse.json(
        { error: 'Failed to create user in Cognito', details: cognitoError.message },
        { status: 500 }
      );
    }

    // Create user in database
    const userResult = await query<SubAgent>(
      `INSERT INTO users (id, email, name, phone, role, parent_agent_id)
       VALUES ($1, $2, $3, $4, 'SUB_AGENT', $5)
       RETURNING id, email, name, phone, role, parent_agent_id, created_at`,
      [cognitoUserId, email, name, phone || null, userId]
    );

    return NextResponse.json({ subAgent: userResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating sub-agent:', error);
    return NextResponse.json(
      { error: 'Failed to create sub-agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

