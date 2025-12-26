/**
 * Test Sub-Agent API Endpoint
 * 
 * This script tests the sub-agent creation API endpoint.
 * It requires a valid access token from a logged-in agent.
 * 
 * Usage: 
 *   npx tsx scripts/test-sub-agent-api.ts <access-token>
 * 
 * Or set ACCESS_TOKEN in .env.local
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const accessToken = process.argv[2] || process.env.ACCESS_TOKEN;

async function testSubAgentAPI() {
  console.log('🧪 Testing Sub-Agent Creation API...\n');

  if (!accessToken) {
    console.error('❌ No access token provided.');
    console.error('\n📋 Usage:');
    console.error('   npx tsx scripts/test-sub-agent-api.ts <access-token>');
    console.error('\n   Or set ACCESS_TOKEN in .env.local');
    console.error('\n💡 To get an access token:');
    console.error('   1. Log in to the app');
    console.error('   2. Open browser console');
    console.error('   3. Run: localStorage.getItem("cognito_access_token")');
    console.error('   4. Copy the token and use it as argument');
    process.exit(1);
  }

  const testEmail = `test-sub-agent-${Date.now()}@test.com`;
  const testData = {
    email: testEmail,
    name: 'Test Sub-Agent',
    password: 'TempPassword123!',
    phone: '+1234567890',
  };

  console.log(`📋 Test Data:`);
  console.log(`   Email: ${testData.email}`);
  console.log(`   Name: ${testData.name}`);
  console.log(`   Phone: ${testData.phone}\n`);

  try {
    console.log('🔌 Calling POST /api/agents/sub-agents...');
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
      process.exit(1);
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
      console.log('\n🎉 Test passed! Sub-agent creation is working correctly.');
      
      // Verify the sub-agent was created in the database
      console.log('\n🔍 Verifying sub-agent in database...');
      const verifyResponse = await fetch(`${API_URL}/api/agents/sub-agents`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (verifyResponse.ok) {
        const { subAgents } = await verifyResponse.json();
        const createdAgent = subAgents?.find((a: any) => a.email === testEmail);
        if (createdAgent) {
          console.log('✅ Sub-agent found in database');
        } else {
          console.warn('⚠️  Sub-agent not found in list (may take a moment to appear)');
        }
      }

      process.exit(0);
    } else {
      console.error('❌ Sub-Agent Creation Failed');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${responseData.error || 'Unknown error'}`);
      if (responseData.details) {
        console.error(`   Details: ${responseData.details}`);
      }
      
      if (response.status === 401) {
        console.error('\n💡 The access token may be expired. Please log in again and get a new token.');
      } else if (response.status === 500 && responseData.details?.includes('AccessDeniedException')) {
        console.error('\n💡 Cognito permissions issue. Check IAM role permissions.');
      } else if (response.status === 500 && responseData.details?.includes('parent_agent_id')) {
        console.error('\n💡 Database migration issue. The parent_agent_id column may not exist.');
      }
      
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testSubAgentAPI();

