/**
 * Investigate why test123 activity cannot be added to itinerary
 * Checks operator_id, column types, and data integrity
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

async function investigate() {
  console.log('🔍 Investigating test123 activity issue...\n');
  console.log('='.repeat(80));

  // Step 1: Find the test123 activity
  console.log('\n📋 Step 1: Finding test123 activity...\n');
  const findActivityQuery = `
    SELECT 
      id,
      title,
      operator_id,
      status,
      destination_city,
      destination_country,
      created_at
    FROM activity_packages
    WHERE title ILIKE '%test123%'
    ORDER BY created_at DESC
    LIMIT 5
  `;

  const activityResult = await invokeQuery(findActivityQuery, []);
  
  if (!activityResult.rows || activityResult.rows.length === 0) {
    console.log('❌ No activity found with title containing "test123"');
    return;
  }

  console.log(`✅ Found ${activityResult.rows.length} activity/activities:\n`);
  activityResult.rows.forEach((activity: any, index: number) => {
    console.log(`Activity ${index + 1}:`);
    console.log(`  ID: ${activity.id}`);
    console.log(`  Title: ${activity.title}`);
    console.log(`  Operator ID: ${activity.operator_id}`);
    console.log(`  Status: ${activity.status}`);
    console.log(`  City: ${activity.destination_city}`);
    console.log(`  Country: ${activity.destination_country}`);
    console.log(`  Created: ${activity.created_at}`);
    console.log('');
  });

  const testActivity = activityResult.rows[0];
  const operatorId = testActivity.operator_id;

  // Step 2: Check operator_id type and format
  console.log('='.repeat(80));
  console.log('\n🔍 Step 2: Checking operator_id value and format...\n');
  
  const checkOperatorIdQuery = `
    SELECT 
      operator_id,
      pg_typeof(operator_id) as column_type,
      operator_id::text as as_text,
      length(operator_id::text) as text_length,
      CASE 
        WHEN operator_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'Valid UUID format' 
        ELSE 'Invalid UUID format' 
      END as uuid_format_check,
      CASE 
        WHEN operator_id IS NULL THEN 'NULL'
        WHEN operator_id::text = '' THEN 'EMPTY STRING'
        ELSE 'HAS VALUE'
      END as value_status
    FROM activity_packages
    WHERE id::text = $1
  `;

  const operatorIdCheck = await invokeQuery(checkOperatorIdQuery, [testActivity.id]);
  if (operatorIdCheck.rows && operatorIdCheck.rows.length > 0) {
    const check = operatorIdCheck.rows[0];
    console.log('Operator ID Details:');
    console.log(`  Value: ${check.operator_id}`);
    console.log(`  Column Type: ${check.column_type}`);
    console.log(`  As Text: ${check.as_text}`);
    console.log(`  Text Length: ${check.text_length}`);
    console.log(`  UUID Format: ${check.uuid_format_check}`);
    console.log(`  Value Status: ${check.value_status}`);
    console.log('');
  }

  // Step 3: Check if operator exists in users table
  console.log('='.repeat(80));
  console.log('\n👤 Step 3: Checking if operator exists in users table...\n');
  
  const checkOperatorQuery = `
    SELECT 
      u.id,
      u.email,
      u.name,
      pg_typeof(u.id) as id_column_type,
      CASE 
        WHEN u.id IS NOT NULL THEN 'EXISTS' 
        ELSE 'MISSING' 
      END as operator_status
    FROM users u
    WHERE u.id::text = $1::text
    LIMIT 1
  `;

  const operatorResult = await invokeQuery(checkOperatorQuery, [operatorId]);
  
  if (operatorResult.rows && operatorResult.rows.length > 0) {
    const operator = operatorResult.rows[0];
    console.log('✅ Operator found in users table:');
    console.log(`  ID: ${operator.id}`);
    console.log(`  Email: ${operator.email}`);
    console.log(`  Name: ${operator.name}`);
    console.log(`  ID Column Type: ${operator.id_column_type}`);
    console.log('');
  } else {
    console.log('❌ Operator NOT found in users table!');
    console.log(`  Looking for operator_id: ${operatorId}`);
    console.log('');
    
    // Try to find operator by email
    console.log('🔍 Searching for operator@gmail.com in users table...\n');
    const findOperatorByEmailQuery = `
      SELECT id, email, name, pg_typeof(id) as id_column_type
      FROM users
      WHERE email = 'operator@gmail.com'
      LIMIT 1
    `;
    
    const emailOperatorResult = await invokeQuery(findOperatorByEmailQuery, []);
    if (emailOperatorResult.rows && emailOperatorResult.rows.length > 0) {
      const emailOperator = emailOperatorResult.rows[0];
      console.log('✅ Found operator by email:');
      console.log(`  ID: ${emailOperator.id}`);
      console.log(`  Email: ${emailOperator.email}`);
      console.log(`  Name: ${emailOperator.name}`);
      console.log(`  ID Column Type: ${emailOperator.id_column_type}`);
      console.log(`\n⚠️  MISMATCH: Activity has operator_id ${operatorId}, but operator@gmail.com has ID ${emailOperator.id}`);
      console.log('');
    } else {
      console.log('❌ operator@gmail.com not found in users table either!');
      console.log('');
    }
  }

  // Step 4: Check column types in all relevant tables
  console.log('='.repeat(80));
  console.log('\n📊 Step 4: Checking column types in database tables...\n');
  
  const columnTypeQuery = `
    SELECT 
      table_name,
      column_name,
      data_type,
      udt_name,
      is_nullable
    FROM information_schema.columns
    WHERE (table_name = 'activity_packages' AND column_name = 'operator_id')
       OR (table_name = 'itinerary_items' AND column_name = 'operator_id')
       OR (table_name = 'users' AND column_name = 'id')
    ORDER BY table_name, column_name
  `;

  const columnTypes = await invokeQuery(columnTypeQuery, []);
  
  if (columnTypes.rows && columnTypes.rows.length > 0) {
    console.log('Column Type Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    columnTypes.rows.forEach((col: any) => {
      console.log(`Table: ${col.table_name.padEnd(25)} Column: ${col.column_name.padEnd(15)} Type: ${col.udt_name || col.data_type} (${col.data_type}) Nullable: ${col.is_nullable}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  }

  // Step 5: Check foreign key constraints
  console.log('='.repeat(80));
  console.log('\n🔗 Step 5: Checking foreign key constraints...\n');
  
  const fkQuery = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND (tc.table_name = 'activity_packages' OR tc.table_name = 'itinerary_items')
      AND (kcu.column_name = 'operator_id' OR ccu.column_name = 'id')
    ORDER BY tc.table_name, kcu.column_name
  `;

  const fkResult = await invokeQuery(fkQuery, []);
  
  if (fkResult.rows && fkResult.rows.length > 0) {
    console.log('Foreign Key Constraints:');
    fkResult.rows.forEach((fk: any) => {
      console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name} (${fk.constraint_name})`);
    });
    console.log('');
  } else {
    console.log('⚠️  No foreign key constraints found (or query returned no results)');
    console.log('');
  }

  // Step 6: Test the actual INSERT that would happen
  console.log('='.repeat(80));
  console.log('\n🧪 Step 6: Testing INSERT query with actual values...\n');
  
  console.log('Simulating INSERT into itinerary_items with:');
  console.log(`  operator_id value: ${operatorId}`);
  console.log(`  operator_id type: ${operatorIdCheck.rows[0]?.column_type || 'unknown'}`);
  console.log('');
  
  // Try to see if we can cast the operator_id
  const testCastQuery = `
    SELECT 
      $1::text as operator_id_text,
      $1::uuid as operator_id_uuid,
      pg_typeof($1::text) as text_type,
      pg_typeof($1::uuid) as uuid_type,
      CASE 
        WHEN $1::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'Can cast to UUID'
        ELSE 'Cannot cast to UUID - invalid format'
      END as cast_result
  `;

  try {
    const castTest = await invokeQuery(testCastQuery, [operatorId]);
    if (castTest.rows && castTest.rows.length > 0) {
      const test = castTest.rows[0];
      console.log('Cast Test Results:');
      console.log(`  As Text: ${test.operator_id_text}`);
      console.log(`  As UUID: ${test.operator_id_uuid}`);
      console.log(`  Text Type: ${test.text_type}`);
      console.log(`  UUID Type: ${test.uuid_type}`);
      console.log(`  Cast Result: ${test.cast_result}`);
      console.log('');
    }
  } catch (error: any) {
    console.log('❌ Cast test failed:');
    console.log(`  Error: ${error.message}`);
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('\n📝 SUMMARY\n');
  console.log('='.repeat(80));
  console.log(`Activity: ${testActivity.title} (${testActivity.id})`);
  console.log(`Operator ID: ${operatorId}`);
  console.log(`Operator Exists: ${operatorResult.rows && operatorResult.rows.length > 0 ? 'YES' : 'NO'}`);
  console.log(`Status: ${testActivity.status}`);
  console.log('');
  
  if (operatorResult.rows && operatorResult.rows.length === 0) {
    console.log('❌ ROOT CAUSE: Operator ID does not exist in users table!');
    console.log('   This will cause foreign key constraint violation when inserting into itinerary_items.');
  } else {
    const operator = operatorResult.rows[0];
    const activityOperatorType = operatorIdCheck.rows[0]?.column_type;
    const usersIdType = operator.id_column_type;
    
    if (activityOperatorType !== usersIdType) {
      console.log('⚠️  POTENTIAL ISSUE: Type mismatch detected!');
      console.log(`   activity_packages.operator_id type: ${activityOperatorType}`);
      console.log(`   users.id type: ${usersIdType}`);
    } else {
      console.log('✅ Types match, but error still occurs. Need to check INSERT query casting.');
    }
  }
  console.log('');
}

investigate().catch((error) => {
  console.error('❌ Investigation failed:', error);
  process.exit(1);
});

