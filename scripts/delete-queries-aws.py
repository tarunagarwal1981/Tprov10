#!/usr/bin/env python3

"""
Delete existing queries from itinerary_queries table via AWS Lambda
This prevents conflicts with the new flow where query form appears after card clicks
"""

import json
import subprocess
import sys
import os

LAMBDA_FUNCTION_NAME = os.getenv("DATABASE_LAMBDA_NAME", "travel-app-database-service")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

def execute_rds_sql(sql):
    """Execute SQL via Lambda"""
    payload = {
        "action": "query",
        "query": sql,
        "params": []
    }
    
    cmd = [
        "aws", "lambda", "invoke",
        "--function-name", LAMBDA_FUNCTION_NAME,
        "--region", AWS_REGION,
        "--payload", json.dumps(payload),
        "/tmp/lambda-result.json"
    ]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        with open("/tmp/lambda-result.json") as f:
            response = json.load(f)
            return response
    except subprocess.CalledProcessError as e:
        print(f"❌ Error executing SQL: {e}", file=sys.stderr)
        print(f"Error output: {e.stderr}", file=sys.stderr)
        return {"statusCode": 500, "error": str(e)}
    except FileNotFoundError:
        print("❌ AWS CLI not found. Please install AWS CLI first.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        return {"statusCode": 500, "error": str(e)}

def main():
    print("🗑️  Deleting existing queries from itinerary_queries table")
    print("=" * 60)
    print()
    
    # Check AWS CLI
    try:
        subprocess.run(["aws", "--version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ AWS CLI not found or not configured")
        print("💡 Please install AWS CLI: https://aws.amazon.com/cli/")
        sys.exit(1)
    
    # Check AWS credentials
    try:
        subprocess.run(["aws", "sts", "get-caller-identity"], check=True, capture_output=True)
        print("✅ AWS CLI configured")
    except subprocess.CalledProcessError:
        print("❌ AWS credentials not configured")
        print("💡 Please run: aws configure")
        sys.exit(1)
    
    print()
    
    # Step 1: Count existing queries
    print("📊 Step 1: Counting existing queries...")
    count_query = "SELECT COUNT(*) as count FROM itinerary_queries"
    count_result = execute_rds_sql(count_query)
    
    if count_result.get("statusCode") == 200:
        body = count_result.get("body", {})
        rows = body.get("rows", [])
        if rows and len(rows) > 0:
            count = rows[0].get("count", 0)
            print(f"Found {count} queries")
        else:
            count = 0
            print("Found 0 queries")
    else:
        print(f"⚠️  Could not count queries: {count_result.get('error', 'Unknown error')}")
        count = 0
    
    print()
    
    # Step 2: Delete all queries
    if count > 0:
        print("🗑️  Step 2: Deleting all queries...")
        delete_query = "DELETE FROM itinerary_queries"
        delete_result = execute_rds_sql(delete_query)
        
        if delete_result.get("statusCode") == 200:
            print("✅ Delete query executed successfully")
        else:
            print(f"❌ Failed to delete queries: {delete_result.get('error', 'Unknown error')}")
            print(f"Response: {json.dumps(delete_result, indent=2)}")
            sys.exit(1)
        
        print()
        
        # Step 3: Verify deletion
        print("✅ Step 3: Verifying deletion...")
        verify_query = "SELECT COUNT(*) as remaining_queries FROM itinerary_queries"
        verify_result = execute_rds_sql(verify_query)
        
        if verify_result.get("statusCode") == 200:
            body = verify_result.get("body", {})
            rows = body.get("rows", [])
            if rows and len(rows) > 0:
                remaining = rows[0].get("remaining_queries", 0)
                if remaining == 0:
                    print(f"✅ Success! All queries deleted. Remaining: {remaining}")
                else:
                    print(f"⚠️  Warning: {remaining} queries still remain")
            else:
                print("✅ Verification complete (no rows returned)")
        else:
            print(f"⚠️  Could not verify deletion: {verify_result.get('error', 'Unknown error')}")
    else:
        print("ℹ️  No queries found. Nothing to delete.")
    
    print()
    print("✅ Done!")

if __name__ == "__main__":
    main()
