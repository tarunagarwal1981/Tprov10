/**
 * Fix VPC Endpoint Security Group Inbound Rules
 * 
 * The VPC endpoint security group needs to allow inbound HTTPS (443) 
 * from the Lambda's security group.
 */

import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  AuthorizeSecurityGroupIngressCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

const REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1';
const LAMBDA_NAME = 'travel-app-database-service';
const VPC_ID = 'vpc-035de28e2067ea386';

const ec2 = new EC2Client({ region: REGION });
const lambda = new LambdaClient({ region: REGION });

async function getLambdaSecurityGroup(): Promise<string | null> {
  console.log('🔍 Getting Lambda security group...');
  
  try {
    const command = new GetFunctionCommand({
      FunctionName: LAMBDA_NAME,
    });
    
    const response = await lambda.send(command);
    const vpcConfig = response.Configuration?.VpcConfig;
    
    if (!vpcConfig || !vpcConfig.SecurityGroupIds || vpcConfig.SecurityGroupIds.length === 0) {
      console.log('   ⚠️  Lambda is not in a VPC or has no security groups');
      return null;
    }
    
    const sgId = vpcConfig.SecurityGroupIds[0];
    if (!sgId) return null;
    console.log(`✅ Lambda security group: ${sgId}`);
    return sgId;
  } catch (error: any) {
    console.error('❌ Error getting Lambda security group:', error.message);
    return null;
  }
}

async function getVpcEndpointSecurityGroup(): Promise<string | null> {
  console.log('🔍 Getting VPC endpoint security group...');
  
  try {
    const command = new DescribeVpcEndpointsCommand({
      Filters: [
        { Name: 'vpc-id', Values: [VPC_ID] },
        { Name: 'service-name', Values: ['com.amazonaws.us-east-1.secretsmanager'] },
      ],
    });
    
    const response = await ec2.send(command);
    const endpoint = response.VpcEndpoints?.[0];
    
    if (!endpoint || !endpoint.Groups || endpoint.Groups.length === 0) {
      console.log('   ⚠️  No VPC endpoint found or no security groups');
      return null;
    }
    
    const sgId = endpoint.Groups[0]?.GroupId;
    if (!sgId) return null;
    console.log(`✅ VPC endpoint security group: ${sgId}`);
    return sgId;
  } catch (error: any) {
    console.error('❌ Error getting VPC endpoint security group:', error.message);
    return null;
  }
}

async function checkInboundRule(endpointSgId: string, lambdaSgId: string): Promise<boolean> {
  console.log(`🔍 Checking inbound rules for security group ${endpointSgId}...`);
  
  try {
    const command = new DescribeSecurityGroupsCommand({
      GroupIds: [endpointSgId],
    });
    
    const response = await ec2.send(command);
    const sg = response.SecurityGroups?.[0];
    
    if (!sg) {
      console.log('   ⚠️  Security group not found');
      return false;
    }
    
    // Check for HTTPS inbound rule from Lambda SG
    const hasInbound = sg.IpPermissions?.some(rule => {
      return rule.IpProtocol === 'tcp' &&
             rule.FromPort === 443 &&
             rule.ToPort === 443 &&
             rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId);
    });
    
    if (hasInbound) {
      console.log('   ✅ Security group already allows HTTPS inbound from Lambda');
      return true;
    }
    
    console.log('   ⚠️  Security group does not allow HTTPS inbound from Lambda');
    return false;
  } catch (error: any) {
    console.error('❌ Error checking security group:', error.message);
    return false;
  }
}

async function addInboundRule(endpointSgId: string, lambdaSgId: string): Promise<void> {
  console.log(`🔨 Adding HTTPS inbound rule to VPC endpoint security group...`);
  console.log(`   From Lambda SG: ${lambdaSgId}`);
  console.log(`   To Endpoint SG: ${endpointSgId}`);
  
  try {
    const command = new AuthorizeSecurityGroupIngressCommand({
      GroupId: endpointSgId,
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          UserIdGroupPairs: [
            {
              GroupId: lambdaSgId,
              Description: 'Allow HTTPS from Lambda for Secrets Manager access',
            },
          ],
        },
      ],
    });
    
    await ec2.send(command);
    console.log('   ✅ HTTPS inbound rule added');
  } catch (error: any) {
    if (error.name === 'InvalidPermission.Duplicate') {
      console.log('   ℹ️  Rule already exists');
    } else {
      throw error;
    }
  }
}

async function main() {
  console.log('=== Fixing VPC Endpoint Security Group Inbound Rules ===\n');
  
  try {
    // Get Lambda security group
    const lambdaSgId = await getLambdaSecurityGroup();
    if (!lambdaSgId) {
      console.error('❌ Could not get Lambda security group');
      process.exit(1);
    }
    
    console.log('');
    
    // Get VPC endpoint security group
    const endpointSgId = await getVpcEndpointSecurityGroup();
    if (!endpointSgId) {
      console.error('❌ Could not get VPC endpoint security group');
      process.exit(1);
    }
    
    console.log('');
    
    // Check if inbound rule exists
    const hasInbound = await checkInboundRule(endpointSgId, lambdaSgId);
    
    if (!hasInbound) {
      console.log('');
      await addInboundRule(endpointSgId, lambdaSgId);
    }
    
    console.log('');
    console.log('=== Summary ===');
    console.log(`✅ Lambda security group: ${lambdaSgId}`);
    console.log(`✅ VPC endpoint security group: ${endpointSgId}`);
    console.log(`✅ Security group now allows HTTPS inbound from Lambda`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Test Lambda again with: {"action":"test"}');
    console.log('2. Should now connect to Secrets Manager successfully');
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

