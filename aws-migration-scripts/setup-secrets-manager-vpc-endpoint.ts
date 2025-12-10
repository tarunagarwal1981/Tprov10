/**
 * Setup VPC Endpoint for Secrets Manager
 * 
 * This script checks for existing VPC endpoints and creates one if needed.
 * Uses AWS SDK to handle the setup programmatically.
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/setup-secrets-manager-vpc-endpoint.ts
 */

import {
  EC2Client,
  DescribeVpcEndpointsCommand,
  CreateVpcEndpointCommand,
  DeleteVpcEndpointsCommand,
  DescribeSecurityGroupsCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupEgressCommand,
} from '@aws-sdk/client-ec2';

const REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1';
const VPC_ID = 'vpc-035de28e2067ea386';
const SUBNET_1 = 'subnet-03492171db95e0412';
const SUBNET_2 = 'subnet-0a9c5d406940f11d2';
const SERVICE_NAME = 'com.amazonaws.us-east-1.secretsmanager';

const ec2 = new EC2Client({ region: REGION });

async function findExistingEndpoint(): Promise<string | null> {
  console.log('🔍 Checking for existing VPC endpoint...');
  
  try {
    const command = new DescribeVpcEndpointsCommand({
      Filters: [
        { Name: 'vpc-id', Values: [VPC_ID] },
        { Name: 'service-name', Values: [SERVICE_NAME] },
      ],
    });
    
    const response = await ec2.send(command);
    
    if (response.VpcEndpoints && response.VpcEndpoints.length > 0) {
      const endpoint = response.VpcEndpoints[0];
      if (!endpoint) return null;
      
      const endpointId = endpoint.VpcEndpointId;
      const state = endpoint.State as string;
      
      console.log(`✅ Found existing endpoint: ${endpointId}`);
      console.log(`   State: ${state}`);
      console.log(`   Private DNS: ${endpoint.PrivateDnsEnabled}`);
      
      if (!endpointId) return null;
      
      if (state === 'available') {
        console.log('   ✅ Endpoint is available and ready to use!');
        return endpointId;
      } else if (state === 'pending') {
        console.log('   ⏳ Endpoint is still being created, waiting...');
        // Wait for it to become available
        return await waitForEndpoint(endpointId);
      } else {
        console.log(`   ⚠️  Endpoint is in ${state} state`);
        return endpointId;
      }
    }
    
    console.log('   No existing endpoint found');
    return null;
  } catch (error: any) {
    console.error('❌ Error checking for endpoint:', error.message);
    return null;
  }
}

async function waitForEndpoint(endpointId: string, maxWaitSeconds = 180): Promise<string> {
  console.log(`⏳ Waiting for endpoint ${endpointId} to become available...`);
  
  const startTime = Date.now();
  const interval = 10000; // 10 seconds
  
  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    try {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [endpointId],
      });
      
      const response = await ec2.send(command);
      const endpoint = response.VpcEndpoints?.[0];
      
      if (endpoint) {
        const state = (endpoint.State as string) || 'unknown';
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`   State: ${state} (${elapsed}s elapsed)`);
        
        if (state === 'available') {
          console.log('   ✅ Endpoint is now available!');
          return endpointId;
        }
        
        if (state === 'failed' || state === 'deleted') {
          throw new Error(`Endpoint ${endpointId} is in ${state} state`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error: any) {
      console.error('   Error checking endpoint status:', error.message);
      throw error;
    }
  }
  
  throw new Error(`Endpoint ${endpointId} did not become available within ${maxWaitSeconds} seconds`);
}

async function getOrCreateSecurityGroup(): Promise<string> {
  console.log('🔍 Getting security group for VPC endpoint...');
  
  try {
    // Try to find default security group
    const describeCommand = new DescribeSecurityGroupsCommand({
      Filters: [
        { Name: 'vpc-id', Values: [VPC_ID] },
        { Name: 'group-name', Values: ['default'] },
      ],
    });
    
    const response = await ec2.send(describeCommand);
    
    if (response.SecurityGroups && response.SecurityGroups.length > 0 && response.SecurityGroups[0]?.GroupId) {
      const sgId = response.SecurityGroups[0].GroupId;
      console.log(`✅ Using default security group: ${sgId}`);
      return sgId;
    }
    
    // Create new security group if default doesn't exist
    console.log('   Creating new security group...');
    const createCommand = new CreateSecurityGroupCommand({
      GroupName: 'secrets-manager-endpoint-sg',
      Description: 'Security group for Secrets Manager VPC endpoint',
      VpcId: VPC_ID,
    });
    
    const createResponse = await ec2.send(createCommand);
    const sgId = createResponse.GroupId!;
    
    console.log(`✅ Created security group: ${sgId}`);
    
    // Allow HTTPS outbound (required for VPC endpoint)
    const authorizeCommand = new AuthorizeSecurityGroupEgressCommand({
      GroupId: sgId,
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '0.0.0.0/0' }],
        },
      ],
    });
    
    await ec2.send(authorizeCommand);
    console.log('   ✅ Allowed HTTPS outbound');
    
    return sgId;
  } catch (error: any) {
    if (error.name === 'InvalidGroup.Duplicate') {
      // Security group already exists, find it
      const describeCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'group-name', Values: ['secrets-manager-endpoint-sg'] },
        ],
      });
      
      const response = await ec2.send(describeCommand);
      if (response.SecurityGroups && response.SecurityGroups.length > 0 && response.SecurityGroups[0]?.GroupId) {
        return response.SecurityGroups[0].GroupId;
      }
    }
    throw error;
  }
}

async function createVpcEndpoint(securityGroupId: string): Promise<string> {
  console.log('🔨 Creating VPC endpoint...');
  console.log(`   VPC: ${VPC_ID}`);
  console.log(`   Subnets: ${SUBNET_1}, ${SUBNET_2}`);
  console.log(`   Security Group: ${securityGroupId}`);
  
  try {
    const command = new CreateVpcEndpointCommand({
      VpcId: VPC_ID,
      ServiceName: SERVICE_NAME,
      VpcEndpointType: 'Interface',
      SubnetIds: [SUBNET_1, SUBNET_2],
      SecurityGroupIds: [securityGroupId],
      PrivateDnsEnabled: true,
    });
    
    const response = await ec2.send(command);
    const endpointId = response.VpcEndpoint?.VpcEndpointId;
    
    if (!endpointId) {
      throw new Error('Failed to create VPC endpoint - no endpoint ID returned');
    }
    
    console.log(`✅ VPC endpoint created: ${endpointId}`);
    console.log('⏳ Waiting for endpoint to become available...');
    
    return await waitForEndpoint(endpointId);
  } catch (error: any) {
    if (error.name === 'InvalidParameterValue' && error.message.includes('private-dns-enabled')) {
      console.error('❌ Error: A VPC endpoint with private DNS already exists for this service');
      console.error('   This means there is a conflicting DNS domain in the VPC.');
      console.error('');
      console.error('   Solution:');
      console.error('   1. Check AWS Console for existing endpoint');
      console.error('   2. If it exists and is available, use it');
      console.error('   3. If it is failed/pending, delete it and try again');
      console.error('');
      console.error('   Checking for existing endpoints...');
      
      // Try to find and report on existing endpoints
      const existing = await findExistingEndpoint();
      if (existing) {
        console.error(`   Found endpoint: ${existing}`);
        console.error('   If this endpoint is not working, delete it first:');
        console.error(`   aws ec2 delete-vpc-endpoints --vpc-endpoint-ids ${existing}`);
      }
      
      throw error;
    }
    throw error;
  }
}

async function main() {
  console.log('=== Setting up VPC Endpoint for Secrets Manager ===\n');
  console.log(`Region: ${REGION}`);
  console.log(`VPC: ${VPC_ID}`);
  console.log(`Service: ${SERVICE_NAME}\n`);
  
  try {
    // Check for existing endpoint
    let endpointId = await findExistingEndpoint();
    
    if (!endpointId) {
      // No existing endpoint, create one
      console.log('');
      const securityGroupId = await getOrCreateSecurityGroup();
      console.log('');
      endpointId = await createVpcEndpoint(securityGroupId);
    }
    
    console.log('');
    console.log('=== Summary ===');
    console.log(`✅ VPC Endpoint is ready: ${endpointId}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Test Lambda function with: {"action":"test"}');
    console.log('2. Lambda should now be able to access Secrets Manager');
    console.log('');
    
  } catch (error: any) {
    console.error('');
    console.error('❌ Error:', error.name || 'Error');
    console.error('   ', error.message || error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});

