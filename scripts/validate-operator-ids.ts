/**
 * Validate all operator_id values are valid UUIDs before migration
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function invokeQuery(sql: string, params: any[] = []): Promise<any> {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  const payload = {
    action: 'query',
    query: sql,
    params: params,
  };

  const command = new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify(payload),
  });

  const response = await lambdaClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.Payload || new Uint8Array()));
  
  if (result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(`Query failed: ${JSON.stringify(errorBody)}`);
  }

  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  return body;
}

async function validateOperatorIds() {
  console.log('🔍 Validating all operator_id values are valid UUIDs...\n');
  console.log('='.repeat(80));

  const tables = [
    'activity_packages',
    'itinerary_items',
    'transfer_packages',
    'multi_city_packages',
    'multi_city_hotel_packages',
    'fixed_departure_flight_packages',
  ];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let allValid = true;

  for (const tableName of tables) {
    try {
      console.log(`📋 Checking ${tableName}...`);
      
      // Check for NULL values
      const nullCount = await invokeQuery(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE operator_id IS NULL`
      );
      const nulls = parseInt(nullCount.rows[0]?.count || '0');
      
      // Check for non-UUID values (if any)
      const invalidQuery = `
        SELECT operator_id, COUNT(*) as count
        FROM ${tableName}
        WHERE operator_id IS NOT NULL 
          AND operator_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        GROUP BY operator_id
        LIMIT 10
      `;
      
      const invalidResult = await invokeQuery(invalidQuery, []);
      const invalidCount = invalidResult.rows?.length || 0;
      
      // Get total count
      const totalResult = await invokeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
      const total = parseInt(totalResult.rows[0]?.count || '0');
      
      // Get non-null count
      const nonNullResult = await invokeQuery(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE operator_id IS NOT NULL`
      );
      const nonNull = parseInt(nonNullResult.rows[0]?.count || '0');
      
      if (invalidCount > 0) {
        console.log(`   ❌ Found ${invalidCount} invalid UUID format(s):`);
        invalidResult.rows.slice(0, 5).forEach((row: any) => {
          console.log(`      - ${row.operator_id} (${row.count} occurrences)`);
        });
        allValid = false;
      } else {
        console.log(`   ✅ All ${nonNull} non-null operator_ids are valid UUID format`);
        if (nulls > 0) {
          console.log(`   ℹ️  ${nulls} NULL values (allowed)`);
        }
      }
      console.log(`   Total rows: ${total}, Non-null operator_ids: ${nonNull}, NULL: ${nulls}`);
      console.log('');
    } catch (error: any) {
      console.log(`   ⚠️  Error checking ${tableName}: ${error.message}`);
      allValid = false;
    }
  }

  console.log('='.repeat(80));
  if (allValid) {
    console.log('\n✅ VALIDATION PASSED: All operator_id values are valid UUIDs or NULL');
    console.log('   Safe to proceed with UUID migration.\n');
  } else {
    console.log('\n❌ VALIDATION FAILED: Some operator_id values are not valid UUIDs');
    console.log('   Migration may fail. Please fix invalid values first.\n');
    process.exit(1);
  }
}

validateOperatorIds().catch((error) => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});

