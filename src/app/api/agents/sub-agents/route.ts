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

    console.log('[Sub-Agent Creation] Request received:', { email, name, hasPassword: !!password, hasPhone: !!phone });

    // Validation: Required fields
    if (!email || !name || !password) {
      const missingFields = [];
      if (!email) missingFields.push('email');
      if (!name) missingFields.push('name');
      if (!password) missingFields.push('password');
      
      console.error('[Sub-Agent Creation] Validation failed: Missing required fields:', missingFields);
      return NextResponse.json(
        { error: 'Missing required fields', details: `The following fields are required: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[Sub-Agent Creation] Validation failed: Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format', details: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validation: Password length
    if (password.length < 8) {
      console.error('[Sub-Agent Creation] Validation failed: Password too short');
      return NextResponse.json(
        { error: 'Password too short', details: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validation: Password complexity (basic check)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      console.error('[Sub-Agent Creation] Validation failed: Password does not meet complexity requirements');
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements', 
          details: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
        },
        { status: 400 }
      );
    }

    console.log('[Sub-Agent Creation] Validations passed, checking for existing user...');

    // Check if user already exists in database
    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser) {
      console.error('[Sub-Agent Creation] Validation failed: User already exists in database:', existingUser.id);
      return NextResponse.json(
        { error: 'User with this email already exists', details: 'A user with this email address is already registered in the system' },
        { status: 400 }
      );
    }

    // Create user in Cognito
    let cognitoUserId: string;
    try {
      console.log('[Sub-Agent Creation] Creating user in Cognito...');
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
        console.error('[Sub-Agent Creation] Failed to get user ID from Cognito response');
        throw new Error('Failed to get user ID from Cognito');
      }

      console.log('[Sub-Agent Creation] User created in Cognito:', cognitoUserId);

      // Set password
      console.log('[Sub-Agent Creation] Setting password in Cognito...');
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      });

      await cognitoClient.send(setPasswordCommand);
      console.log('[Sub-Agent Creation] Password set successfully in Cognito');
    } catch (cognitoError: any) {
      console.error('[Sub-Agent Creation] Error creating user in Cognito:', {
        errorName: cognitoError.name,
        errorMessage: cognitoError.message,
        email,
      });
      
      // Handle specific Cognito errors with better messages
      if (cognitoError.name === 'UsernameExistsException') {
        console.error('[Sub-Agent Creation] Username already exists in Cognito:', email);
        return NextResponse.json(
          { error: 'A user with this email already exists in the system', details: 'This email is already registered. Please use a different email address.' },
          { status: 409 } // Conflict status code
        );
      }
      
      if (cognitoError.name === 'InvalidPasswordException') {
        console.error('[Sub-Agent Creation] Password does not meet Cognito policy requirements');
        return NextResponse.json(
          { error: 'Password does not meet requirements', details: 'Password must contain uppercase, lowercase, number, and special character.' },
          { status: 400 }
        );
      }
      
      console.error('[Sub-Agent Creation] Unexpected Cognito error:', cognitoError);
      return NextResponse.json(
        { error: 'Failed to create user in Cognito', details: cognitoError.message || 'An unexpected error occurred while creating the user' },
        { status: 500 }
      );
    }

    // Create user in database
    console.log('[Sub-Agent Creation] Creating user in database...');
    const userResult = await query<SubAgent>(
      `INSERT INTO users (id, email, name, phone, role, parent_agent_id)
       VALUES ($1, $2, $3, $4, 'SUB_AGENT', $5)
       RETURNING id, email, name, phone, role, parent_agent_id, created_at`,
      [cognitoUserId, email, name, phone || null, userId]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      console.error('[Sub-Agent Creation] Failed to create user in database - no rows returned');
      return NextResponse.json(
        { error: 'Failed to create user in database', details: 'User was created in Cognito but not in the database' },
        { status: 500 }
      );
    }

    const createdSubAgent = userResult.rows[0];
    console.log('[Sub-Agent Creation] Sub-agent created successfully:', {
      id: createdSubAgent?.id,
      email: createdSubAgent?.email,
      name: createdSubAgent?.name,
    });

    return NextResponse.json({ subAgent: userResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Sub-Agent Creation] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to create sub-agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

