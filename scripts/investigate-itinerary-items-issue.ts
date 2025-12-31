/**
 * Investigation Script: Itinerary Items Foreign Key Issue
 * 
 * This script investigates the database schema and data to understand
 * why itinerary item creation is failing with foreign key errors.
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

interface LambdaResponse {
  statusCode: number;
  body: string | any;
}

async function invokeQuery(sql: string, params: any[] = []): Promise<LambdaResponse> {
  const clientConfig: any = {
    region: AWS_REGION,
  };
  
  // Explicitly use credentials from environment variables
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
    console.log('[Lambda Client] Using credentials from environment variables');
  } else {
    console.warn('[Lambda Client] ⚠️  No AWS credentials found in environment variables');
  }
  
  const lambdaClient = new LambdaClient(clientConfig);

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
  
  if (!response.Payload) {
    throw new Error('Lambda returned no payload');
  }

  const result = JSON.parse(
    new TextDecoder().decode(response.Payload || new Uint8Array())
  );
  
  // Handle Lambda response format
  let body;
  if (result.statusCode === 200) {
    body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  } else {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(errorBody.message || errorBody.error || 'Lambda invocation failed');
  }

  if (body.error) {
    throw new Error(`Database error: ${body.error}`);
  }

  return { statusCode: 200, body };
}

async function investigate() {
  console.log('🔍 Investigating Itinerary Items Foreign Key Issue\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Check users table structure
    console.log('\n1️⃣ Checking users table structure...');
    const usersTableInfo = await invokeQuery(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log('Users table columns:');
    console.table(usersTableInfo.body.rows || []);
    
    // 2. Check itinerary_items table structure
    console.log('\n2️⃣ Checking itinerary_items table structure...');
    const itemsTableInfo = await invokeQuery(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'itinerary_items'
      ORDER BY ordinal_position;
    `);
    console.log('Itinerary_items table columns:');
    console.table(itemsTableInfo.body.rows || []);
    
    // 3. Check foreign key constraints on itinerary_items
    console.log('\n3️⃣ Checking foreign key constraints on itinerary_items...');
    const fkConstraints = await invokeQuery(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
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
        AND tc.table_name = 'itinerary_items';
    `);
    console.log('Foreign key constraints:');
    console.table(fkConstraints.body.rows || []);
    
    // 4. Check activity_packages table structure
    console.log('\n4️⃣ Checking activity_packages table structure...');
    const activityTableInfo = await invokeQuery(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'activity_packages'
      ORDER BY ordinal_position;
    `);
    console.log('Activity_packages table columns:');
    console.table(activityTableInfo.body.rows || []);
    
    // 5. Count users in users table
    console.log('\n5️⃣ Counting users in users table...');
    const usersCount = await invokeQuery(`
      SELECT COUNT(*) as count FROM users;
    `);
    console.log(`Total users: ${usersCount.body.rows[0]?.count || 0}`);
    
    // 6. Count activities and check operator_ids
    console.log('\n6️⃣ Checking activity_packages operator_ids...');
    const activitiesInfo = await invokeQuery(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT operator_id) as unique_operators,
        COUNT(CASE WHEN operator_id IS NULL THEN 1 END) as null_operator_ids
      FROM activity_packages;
    `);
    console.log('Activity packages statistics:');
    console.table(activitiesInfo.body.rows);
    
    // 7. Find operator_ids in activities that don't exist in users
    console.log('\n7️⃣ Finding operator_ids in activities that DON\'T exist in users...');
    const missingOperators = await invokeQuery(`
      SELECT DISTINCT ap.operator_id, COUNT(*) as activity_count
      FROM activity_packages ap
      LEFT JOIN users u ON ap.operator_id::text = u.id::text
      WHERE u.id IS NULL
        AND ap.operator_id IS NOT NULL
      GROUP BY ap.operator_id
      ORDER BY activity_count DESC
      LIMIT 20;
    `);
    console.log(`Found ${missingOperators.body.rows.length} operator_ids in activities that don't exist in users:`);
    if (missingOperators.body.rows.length > 0) {
      console.table(missingOperators.body.rows);
    } else {
      console.log('✅ All operator_ids in activities exist in users table');
    }
    
    // 8. Sample some activities with their operator_ids
    console.log('\n8️⃣ Sample activities with operator_ids...');
    const sampleActivities = await invokeQuery(`
      SELECT 
        ap.id,
        ap.title,
        ap.operator_id,
        CASE WHEN u.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as operator_exists
      FROM activity_packages ap
      LEFT JOIN users u ON ap.operator_id::text = u.id::text
      WHERE ap.status = 'published'
      LIMIT 10;
    `);
    console.log('Sample activities:');
    console.table(sampleActivities.body.rows);
    
    // 9. Check if there are any itinerary_items already created
    console.log('\n9️⃣ Checking existing itinerary_items...');
    const existingItems = await invokeQuery(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT operator_id) as unique_operators,
        COUNT(CASE WHEN operator_id IS NULL THEN 1 END) as null_operator_ids
      FROM itinerary_items;
    `);
    console.log('Existing itinerary_items statistics:');
    console.table(existingItems.body.rows);
    
    // 10. Check for any itinerary_items with invalid operator_ids
    console.log('\n🔟 Checking for itinerary_items with invalid operator_ids...');
    const invalidItems = await invokeQuery(`
      SELECT 
        ii.id,
        ii.operator_id,
        ii.package_type,
        ii.package_title
      FROM itinerary_items ii
      LEFT JOIN users u ON ii.operator_id::text = u.id::text
      WHERE u.id IS NULL
      LIMIT 10;
    `);
    if (invalidItems.body.rows.length > 0) {
      console.log(`⚠️  Found ${invalidItems.body.rows.length} itinerary_items with invalid operator_ids:`);
      console.table(invalidItems.body.rows);
    } else {
      console.log('✅ All existing itinerary_items have valid operator_ids');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Investigation complete!');
    
  } catch (error: any) {
    console.error('\n❌ Error during investigation:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run investigation
investigate()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

