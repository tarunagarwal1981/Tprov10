# Lambda VPC Endpoint Fix - Secrets Manager Access

## Problem
Lambda in VPC can't reach Secrets Manager (port 443) because VPC Lambdas don't have internet access by default.

## Solution: Create VPC Endpoint for Secrets Manager

### Option 1: VPC Endpoint (Recommended - No Internet Needed)

1. **Go to VPC Console**: https://console.aws.amazon.com/vpc/home?region=us-east-1#Endpoints:
2. **Create Endpoint**:
   - Name: `secrets-manager-endpoint`
   - Service category: **AWS services**
   - Service name: `com.amazonaws.us-east-1.secretsmanager`
   - VPC: `vpc-035de28e2067ea386`
   - Subnets: Select both:
     - `subnet-03492171db95e0412` (us-east-1a)
     - `subnet-0a9c5d406940f11d2` (us-east-1b)
   - Security group: Create new or use existing (must allow HTTPS outbound)
   - Policy: **Full access** (or custom)
   - **Create endpoint**

3. **Wait 2-3 minutes** for endpoint to be available

4. **Test Lambda again** - should now connect to Secrets Manager

### Option 2: NAT Gateway (Alternative - Requires Internet)

If you prefer NAT Gateway (allows Lambda to reach internet):

1. **Create NAT Gateway** in public subnet
2. **Update route table** for private subnets to route 0.0.0.0/0 → NAT Gateway
3. **More expensive** (~$32/month + data transfer)

## Quick Fix: Use VPC Endpoint

**VPC Endpoint is better because:**
- ✅ No internet needed (more secure)
- ✅ Lower latency
- ✅ No data transfer costs
- ✅ Private connectivity

## After Creating VPC Endpoint

1. **Test Lambda again** with test event: `{"action":"test"}`
2. **Should see**: `{"statusCode":200,"body":"{\"success\":true,\"time\":\"...\"}"}`
3. **Then proceed** with Next.js integration

## Security Group for VPC Endpoint

The security group for the VPC endpoint needs:
- **Outbound**: HTTPS (443) to Secrets Manager
- Or use the default security group (allows all outbound)

