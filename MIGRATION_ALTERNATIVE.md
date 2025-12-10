# Alternative Migration Methods

If you're getting connection timeouts when running the migration locally, it's likely because your RDS instance is in a VPC and not directly accessible from your local machine.

## Option 1: Run Migration from AWS EC2/Bastion Host

If you have an EC2 instance or bastion host in the same VPC as your RDS:

1. SSH into the EC2 instance
2. Clone your repository or copy the migration file
3. Run the migration from there

## Option 2: Use AWS Systems Manager Session Manager

If you have SSM access to an EC2 instance:

```bash
aws ssm start-session --target <instance-id>
# Then run the migration from there
```

## Option 3: Use AWS RDS Query Editor (Limited)

AWS RDS Query Editor can run SQL, but it has limitations:
- Can't run complex migrations with functions/triggers
- Limited to simple SQL statements

## Option 4: Use Database GUI Tool with SSH Tunnel

1. Set up an SSH tunnel through a bastion host
2. Connect your database GUI (pgAdmin, DBeaver, etc.) through the tunnel
3. Run the migration SQL file

## Option 5: Update RDS Security Group (Temporary)

**⚠️ Security Risk - Only for temporary migration**

1. Go to AWS RDS Console
2. Select your RDS instance
3. Go to "Connectivity & security" → Security groups
4. Edit inbound rules
5. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your IP address (or 0.0.0.0/0 for any - NOT RECOMMENDED)
6. Run migration
7. **Remove the rule after migration**

## Option 6: Run Migration via Lambda Function

Create a Lambda function that:
1. Connects to RDS (same VPC)
2. Executes the migration SQL
3. Can be triggered manually or via API

This is the most secure and production-ready approach.

## Recommended: Option 6 (Lambda)

Would you like me to create a Lambda function to run the migration? This is the safest approach for production databases.

