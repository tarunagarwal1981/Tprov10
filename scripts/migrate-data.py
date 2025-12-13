#!/usr/bin/env python3
"""
Migrate data from Supabase to RDS
"""
import sys
import json
import subprocess
import os

SUPABASE_URL = "https://megmjzszmqnmzdxwzigt.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA"
LAMBDA_FUNCTION = os.getenv("DATABASE_LAMBDA_NAME", "travel-app-database-service")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

def get_supabase_data(table):
    """Fetch data from Supabase"""
    import urllib.request
    import urllib.parse
    
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*"
    req = urllib.request.Request(url)
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read())
    except Exception as e:
        print(f"Error fetching from Supabase: {e}", file=sys.stderr)
        return []

def execute_rds_sql(sql):
    """Execute SQL via Lambda"""
    payload = {
        "action": "query",
        "query": sql,
        "params": []
    }
    
    cmd = [
        "aws", "lambda", "invoke",
        "--function-name", LAMBDA_FUNCTION,
        "--region", AWS_REGION,
        "--payload", json.dumps(payload),
        "/tmp/lambda-result.json"
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        with open("/tmp/lambda-result.json") as f:
            result = json.load(f)
            return result
    except Exception as e:
        print(f"Error executing SQL: {e}", file=sys.stderr)
        return {"statusCode": 500}

def migrate_table(table_name):
    """Migrate a single table"""
    print(f"📋 Migrating {table_name}...")
    
    # Get data from Supabase
    data = get_supabase_data(table_name)
    if not isinstance(data, list):
        data = []
    
    print(f"   Found {len(data)} rows in Supabase")
    
    if len(data) == 0:
        print("   ✅ No data to migrate")
        return
    
    inserted = 0
    skipped = 0
    errors = 0
    
    for row in data:
        # Build INSERT statement
        keys = list(row.keys())
        values = []
        
        for k in keys:
            v = row[k]
            if v is None:
                values.append("NULL")
            elif isinstance(v, (dict, list)):
                json_str = json.dumps(v).replace("'", "''")
                values.append(f"'{json_str}'::jsonb")
            elif isinstance(v, str):
                escaped = v.replace("'", "''")
                values.append(f"'{escaped}'")
            elif isinstance(v, bool):
                values.append("true" if v else "false")
            else:
                values.append(str(v))
        
        columns = ", ".join(keys)
        values_str = ", ".join(values)
        sql = f"INSERT INTO {table_name} ({columns}) VALUES ({values_str}) ON CONFLICT (id) DO NOTHING"
        
        # Execute
        result = execute_rds_sql(sql)
        status = result.get("statusCode", 0)
        
        if status == 200:
            inserted += 1
            if inserted % 5 == 0:
                print(f"      Progress: {inserted}/{len(data)}")
        else:
            error = result.get("body", "{}")
            if isinstance(error, str):
                try:
                    error = json.loads(error)
                except:
                    pass
            error_msg = error.get("message", "Unknown error") if isinstance(error, dict) else str(error)
            
            if "duplicate" in error_msg.lower() or "already exists" in error_msg.lower():
                skipped += 1
            else:
                errors += 1
                print(f"      ⚠️  Error: {error_msg}")
    
    print(f"   ✅ Complete: Inserted={inserted}, Skipped={skipped}, Errors={errors}")

if __name__ == "__main__":
    tables = [
        "multi_city_package_day_plans",
        "multi_city_hotel_package_day_plans",
        "multi_city_hotel_pricing_rows",
        "multi_city_hotel_private_package_rows"
    ]
    
    print("🚀 Migrating Data from Supabase to RDS")
    print("=======================================\n")
    
    for table in tables:
        migrate_table(table)
        print()
    
    print("✅ Data migration complete!")

