/**
 * Fix Lambda Security Group for VPC Endpoint Access
 * 
 * The Lambda needs outbound HTTPS (443) access to reach the VPC endpoint.
 * This script checks and updates the Lambda's security group.
 */

import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  AuthorizeSecurityGroupEgressCommand,
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

async function getVpcEndpointSecurityGroups(): Promise<string[]> {
  console.log('🔍 Getting VPC endpoint security groups...');
  
  try {
    const command = new DescribeVpcEndpointsCommand({
      Filters: [
        { Name: 'vpc-id', Values: [VPC_ID] },
        { Name: 'service-name', Values: ['com.amazonaws.us-east-1.secretsmanager'] },
      ],
    });
    
    const response = await ec2.send(command);
    
    if (!response.VpcEndpoints || response.VpcEndpoints.length === 0) {
      console.log('   ⚠️  No VPC endpoint found');
      return [];
    }
    
    const endpoint = response.VpcEndpoints?.[0];
    if (!endpoint) return [];
    const sgIds = endpoint.Groups?.map(g => g.GroupId || '').filter(Boolean) || [];
    
    console.log(`✅ VPC endpoint security groups: ${sgIds.join(', ')}`);
    return sgIds;
  } catch (error: any) {
    console.error('❌ Error getting VPC endpoint security groups:', error.message);
    return [];
  }
}

async function checkSecurityGroupRules(sgId: string): Promise<boolean> {
  console.log(`🔍 Checking security group ${sgId} rules...`);
  
  try {
    const command = new DescribeSecurityGroupsCommand({
      GroupIds: [sgId],
    });
    
    const response = await ec2.send(command);
    const sg = response.SecurityGroups?.[0];
    
    if (!sg) {
      console.log('   ⚠️  Security group not found');
      return false;
    }
    
    // Check for HTTPS outbound rule
    const hasHttpsOutbound = sg.IpPermissionsEgress?.some(rule => {
      return rule.IpProtocol === 'tcp' &&
             rule.FromPort === 443 &&
             rule.ToPort === 443 &&
             (rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0') ||
              (rule.UserIdGroupPairs && rule.UserIdGroupPairs.length > 0));
    });
    
    if (hasHttpsOutbound) {
      console.log('   ✅ Security group already allows HTTPS outbound');
      return true;
    }
    
    console.log('   ⚠️  Security group does not allow HTTPS outbound');
    return false;
  } catch (error: any) {
    console.error('❌ Error checking security group:', error.message);
    return false;
  }
}

async function addHttpsOutboundRule(sgId: string): Promise<void> {
  console.log(`🔨 Adding HTTPS outbound rule to security group ${sgId}...`);
  
  try {
    const command = new AuthorizeSecurityGroupEgressCommand({
      GroupId: sgId,
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'Allow HTTPS to VPC endpoint' }],
        },
      ],
    });
    
    await ec2.send(command);
    console.log('   ✅ HTTPS outbound rule added');
  } catch (error: any) {
    if (error.name === 'InvalidPermission.Duplicate') {
      console.log('   ℹ️  Rule already exists');
    } else {
      throw error;
    }
  }
}

async function main() {
  console.log('=== Fixing Lambda Security Group for VPC Endpoint Access ===\n');
  
  try {
    // Get Lambda security group
    const lambdaSgId = await getLambdaSecurityGroup();
    if (!lambdaSgId) {
      console.error('❌ Could not get Lambda security group');
      process.exit(1);
    }
    
    console.log('');
    
    // Get VPC endpoint security groups
    const endpointSgIds = await getVpcEndpointSecurityGroups();
    
    console.log('');
    
    // Check if Lambda SG allows HTTPS outbound
    const hasHttps = await checkSecurityGroupRules(lambdaSgId);
    
    if (!hasHttps) {
      console.log('');
      await addHttpsOutboundRule(lambdaSgId);
    }
    
    // Also ensure VPC endpoint SG allows inbound from Lambda SG
    if (endpointSgIds.length > 0) {
      console.log('');
      console.log('🔍 Checking VPC endpoint security group inbound rules...');
      
      for (const endpointSgId of endpointSgIds) {
        const endpointSg = await ec2.send(new DescribeSecurityGroupsCommand({
          GroupIds: [endpointSgId],
        }));
        
        const sg = endpointSg.SecurityGroups?.[0];
        const allowsInbound = sg?.IpPermissions?.some(rule => {
          return rule.IpProtocol === 'tcp' &&
                 rule.FromPort === 443 &&
                 rule.ToPort === 443 &&
                 rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId);
        });
        
        if (!allowsInbound) {
          console.log(`   ⚠️  VPC endpoint SG ${endpointSgId} may need inbound rule from Lambda SG`);
          console.log(`   ℹ️  VPC endpoints typically allow all inbound from VPC by default`);
        } else {
          console.log(`   ✅ VPC endpoint SG ${endpointSgId} allows inbound from Lambda`);
        }
      }
    }
    
    console.log('');
    console.log('=== Summary ===');
    console.log(`✅ Lambda security group: ${lambdaSgId}`);
    console.log(`✅ Security group now allows HTTPS outbound`);
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

