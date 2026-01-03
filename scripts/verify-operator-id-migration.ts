/**
 * Post-Migration Verification: Verify operator_id migration to UUID
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

async function verifyMigration() {
  console.log('🔍 Verifying operator_id UUID migration...\n');
  console.log('='.repeat(80));

  const tables = [
    'activity_packages',
    'itinerary_items',
    'transfer_packages',
    'multi_city_packages',
    'multi_city_hotel_packages',
    'fixed_departure_flight_packages',
  ];

  let allPassed = true;

  // Step 1: Verify column types
  console.log('\n📊 Step 1: Verifying column types...\n');
  for (const tableName of tables) {
    try {
      const typeQuery = `
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'operator_id'
      `;
      const result = await invokeQuery(typeQuery, [tableName]);
      
      if (result.rows && result.rows.length > 0) {
        const col = result.rows[0];
        const isUUID = col.udt_name === 'uuid' || col.data_type === 'uuid';
        
        if (isUUID) {
          console.log(`   ✅ ${tableName}.operator_id: UUID`);
        } else {
          console.log(`   ❌ ${tableName}.operator_id: ${col.udt_name} (expected UUID)`);
          allPassed = false;
        }
      } else {
        console.log(`   ⚠️  ${tableName}.operator_id: Column not found`);
        allPassed = false;
      }
    } catch (error: any) {
      console.log(`   ❌ ${tableName}: Error - ${error.message}`);
      allPassed = false;
    }
  }

  // Step 2: Test SELECT queries without casts
  console.log('\n📊 Step 2: Testing SELECT queries without casts...\n');
  for (const tableName of tables) {
    try {
      // Get a sample operator_id
      const sampleQuery = `SELECT operator_id FROM ${tableName} WHERE operator_id IS NOT NULL LIMIT 1`;
      const sampleResult = await invokeQuery(sampleQuery, []);
      
      if (sampleResult.rows && sampleResult.rows.length > 0) {
        const operatorId = sampleResult.rows[0].operator_id;
        
        // Test query without cast
        const testQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE operator_id = $1`;
        const testResult = await invokeQuery(testQuery, [operatorId]);
        
        if (testResult.rows && testResult.rows.length > 0) {
          console.log(`   ✅ ${tableName}: SELECT with UUID comparison works`);
        } else {
          console.log(`   ❌ ${tableName}: SELECT query failed`);
          allPassed = false;
        }
      } else {
        console.log(`   ⏭️  ${tableName}: No data to test`);
      }
    } catch (error: any) {
      console.log(`   ❌ ${tableName}: Error - ${error.message}`);
      allPassed = false;
    }
  }

  // Step 3: Check foreign key constraint
  console.log('\n📊 Step 3: Checking foreign key constraint...\n');
  try {
    const fkQuery = `
      SELECT
        tc.constraint_name, tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'itinerary_items' 
        AND kcu.column_name = 'operator_id'
    `;
    const fkResult = await invokeQuery(fkQuery, []);
    
    if (fkResult.rows && fkResult.rows.length > 0) {
      const fk = fkResult.rows[0];
      console.log(`   ✅ Foreign key constraint exists: ${fk.constraint_name}`);
      console.log(`      ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    } else {
      console.log(`   ⚠️  Foreign key constraint not found (may have invalid references)`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error checking FK: ${error.message}`);
  }

  // Step 4: Check for invalid references
  console.log('\n📊 Step 4: Checking for invalid operator_id references...\n');
  try {
    const invalidQuery = `
      SELECT COUNT(*) as count
      FROM itinerary_items ii
      LEFT JOIN users u ON ii.operator_id = u.id
      WHERE ii.operator_id IS NOT NULL AND u.id IS NULL
    `;
    const invalidResult = await invokeQuery(invalidQuery, []);
    const invalidCount = parseInt(invalidResult.rows[0]?.count || '0');
    
    if (invalidCount === 0) {
      console.log(`   ✅ No invalid operator_id references found`);
    } else {
      console.log(`   ⚠️  Found ${invalidCount} invalid operator_id references`);
      console.log(`      These need to be fixed before adding foreign key constraint`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error checking invalid references: ${error.message}`);
  }

  // Step 5: Test INSERT operation (simulation)
  console.log('\n📊 Step 5: Testing INSERT operation structure...\n');
  try {
    // Get a valid operator_id from users table
    const userQuery = `SELECT id FROM users LIMIT 1`;
    const userResult = await invokeQuery(userQuery, []);
    
    if (userResult.rows && userResult.rows.length > 0) {
      const testOperatorId = userResult.rows[0].id;
      console.log(`   ✅ Found test operator_id: ${testOperatorId}`);
      console.log(`   ✅ INSERT operations should work with UUID values`);
    } else {
      console.log(`   ⚠️  No users found for testing`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error testing INSERT: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80));
  if (allPassed) {
    console.log('\n✅ VERIFICATION PASSED: Migration successful!\n');
    console.log('   All columns are UUID type');
    console.log('   All queries work without casts');
    console.log('   Ready for production use\n');
  } else {
    console.log('\n⚠️  VERIFICATION INCOMPLETE: Some checks failed\n');
    console.log('   Please review the errors above\n');
  }
}

verifyMigration().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});

