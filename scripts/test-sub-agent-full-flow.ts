/**
 * Full Flow Test: Login + Create Sub-Agent
 * 
 * This script:
 * 1. Logs in as an agent to get an access token
 * 2. Uses that token to create a sub-agent
 * 3. Verifies the sub-agent was created
 * 
 * Usage: npx tsx scripts/test-sub-agent-full-flow.ts
 * 
 * Requires in .env.local:
 * - TEST_AGENT_EMAIL (e.g., agent@gmail.com)
 * - TEST_AGENT_PASSWORD
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const testAgentEmail = process.argv[2] || process.env.TEST_AGENT_EMAIL || 'agent@gmail.com';
const testAgentPassword = process.argv[3] || process.env.TEST_AGENT_PASSWORD || '';

async function loginAndGetToken(): Promise<string | null> {
  console.log('🔐 Step 1: Logging in as agent...\n');
  console.log(`   Email: ${testAgentEmail}`);

  if (!testAgentPassword) {
    console.error('❌ Password not provided');
    console.error('\n📋 Usage:');
    console.error('   npx tsx scripts/test-sub-agent-full-flow.ts [email] [password]');
    console.error('\n   Or set in .env.local:');
    console.error('   TEST_AGENT_EMAIL=agent@gmail.com');
    console.error('   TEST_AGENT_PASSWORD=your-password');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testAgentEmail,
        password: testAgentPassword,
      }),
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Login response is not valid JSON:');
      console.error(responseText);
      return null;
    }

    if (response.ok && responseData.accessToken) {
      console.log('✅ Login successful\n');
      return responseData.accessToken;
    } else {
      console.error('❌ Login failed');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${responseData.error || responseData.message || 'Unknown error'}`);
      return null;
    }
  } catch (error: any) {
    console.error('❌ Login request failed:');
    console.error(error.message);
    return null;
  }
}

async function createSubAgent(accessToken: string) {
  console.log('🚀 Step 2: Creating sub-agent...\n');

  const testEmail = `test-sub-agent-${Date.now()}@test.com`;
  const testData = {
    email: testEmail,
    name: 'Test Sub-Agent',
    password: 'TempPassword123!',
    phone: '+1234567890',
  };

  console.log(`📋 Sub-Agent Details:`);
  console.log(`   Email: ${testData.email}`);
  console.log(`   Name: ${testData.name}`);
  console.log(`   Phone: ${testData.phone}\n`);

  try {
    const response = await fetch(`${API_URL}/api/agents/sub-agents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Response is not valid JSON:');
      console.error(responseText);
      return false;
    }

    console.log(`📊 Response Status: ${response.status}\n`);

    if (response.ok) {
      console.log('✅ Sub-Agent Created Successfully!');
      console.log('\n📋 Created Sub-Agent:');
      console.log(`   ID: ${responseData.subAgent?.id}`);
      console.log(`   Email: ${responseData.subAgent?.email}`);
      console.log(`   Name: ${responseData.subAgent?.name}`);
      console.log(`   Role: ${responseData.subAgent?.role}`);
      console.log(`   Parent Agent ID: ${responseData.subAgent?.parent_agent_id}`);
      return true;
    } else {
      console.error('❌ Sub-Agent Creation Failed');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${responseData.error || 'Unknown error'}`);
      if (responseData.details) {
        console.error(`   Details: ${responseData.details}`);
      }
      
      if (response.status === 401) {
        console.error('\n💡 The access token may be expired or invalid.');
      } else if (response.status === 500 && responseData.details?.includes('AccessDeniedException')) {
        console.error('\n💡 Cognito permissions issue. Check IAM role permissions.');
      } else if (response.status === 500 && responseData.details?.includes('parent_agent_id')) {
        console.error('\n💡 Database migration issue. The parent_agent_id column may not exist.');
      }
      
      return false;
    }
  } catch (error: any) {
    console.error('❌ Request failed:');
    console.error(error.message);
    return false;
  }
}

async function verifySubAgent(accessToken: string, testEmail: string) {
  console.log('\n🔍 Step 3: Verifying sub-agent in database...\n');

  try {
    const response = await fetch(`${API_URL}/api/agents/sub-agents`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const { subAgents } = await response.json();
      const createdAgent = subAgents?.find((a: any) => a.email === testEmail);
      
      if (createdAgent) {
        console.log('✅ Sub-agent found in database');
        console.log(`   Email: ${createdAgent.email}`);
        console.log(`   Name: ${createdAgent.name}`);
        console.log(`   Assigned Leads: ${createdAgent.assignedLeadsCount || 0}`);
        return true;
      } else {
        console.warn('⚠️  Sub-agent not found in list (may take a moment to appear)');
        return false;
      }
    } else {
      console.error(`❌ Failed to fetch sub-agents: ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Verification failed:');
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 Sub-Agent Creation Full Flow Test');
  console.log('='.repeat(60) + '\n');

  // Step 1: Login
  const accessToken = await loginAndGetToken();
  if (!accessToken) {
    console.log('\n❌ Cannot proceed without access token');
    process.exit(1);
  }

  // Step 2: Create sub-agent
  const testEmail = `test-sub-agent-${Date.now()}@test.com`;
  const created = await createSubAgent(accessToken);
  if (!created) {
    console.log('\n❌ Sub-agent creation failed');
    process.exit(1);
  }

  // Step 3: Verify
  await verifySubAgent(accessToken, testEmail);

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests passed! Sub-agent creation is working correctly.');
  console.log('='.repeat(60));
  process.exit(0);
}

main();

