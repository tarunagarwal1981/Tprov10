import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

/**
 * DELETE /api/agents/sub-agents/[subAgentId]
 * Delete a sub-agent
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subAgentId: string }> }
) {
  try {
    const { subAgentId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify sub-agent belongs to this agent
    const subAgent = await queryOne<{ id: string; email: string; parent_agent_id: string }>(
      'SELECT id, email, parent_agent_id FROM users WHERE id = $1',
      [subAgentId]
    );

    if (!subAgent) {
      return NextResponse.json({ error: 'Sub-agent not found' }, { status: 404 });
    }

    if (subAgent.parent_agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from Cognito
    try {
      const deleteUserCommand = new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: subAgent.email,
      });
      await cognitoClient.send(deleteUserCommand);
    } catch (cognitoError: any) {
      // Log but continue - user might already be deleted
      console.warn('Error deleting user from Cognito (continuing anyway):', cognitoError);
    }

    // Delete assignments
    await query(
      'DELETE FROM sub_agent_assignments WHERE sub_agent_id = $1',
      [subAgentId]
    );

    // Delete user from database (CASCADE will handle related records)
    await query(
      'DELETE FROM users WHERE id = $1',
      [subAgentId]
    );

    return NextResponse.json({ success: true, deletedId: subAgentId });
  } catch (error) {
    console.error('Error deleting sub-agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete sub-agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

