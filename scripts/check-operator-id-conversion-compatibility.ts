/**
 * Check if converting operator_id from TEXT to UUID would be backward compatible
 * Analyzes existing data, constraints, and potential issues
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '/0KocZx7f1XpkrvFe6mREMRCS5etRya/+xnnOn7y';
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

async function checkCompatibility() {
  console.log('🔍 Checking backward compatibility of converting operator_id TEXT → UUID\n');
  console.log('='.repeat(80));

  // Step 1: Check itinerary_items table
  console.log('\n📊 Step 1: Analyzing itinerary_items.operator_id data...\n');
  
  const itineraryItemsQuery = `
    SELECT 
      COUNT(*) as total_rows,
      COUNT(operator_id) as non_null_count,
      COUNT(*) - COUNT(operator_id) as null_count,
      COUNT(CASE 
        WHEN operator_id IS NOT NULL AND 
             operator_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 1 
      END) as valid_uuid_count,
      COUNT(CASE 
        WHEN operator_id IS NOT NULL AND 
             NOT (operator_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') 
        THEN 1 
      END) as invalid_uuid_count,
      COUNT(DISTINCT operator_id) as distinct_values
    FROM itinerary_items
  `;

  const itineraryItemsResult = await invokeQuery(itineraryItemsQuery, []);
  const itemsStats = itineraryItemsResult.rows[0];
  
  console.log('itinerary_items.operator_id Statistics:');
  console.log(`  Total rows: ${itemsStats.total_rows}`);
  console.log(`  Non-null values: ${itemsStats.non_null_count}`);
  console.log(`  NULL values: ${itemsStats.null_count}`);
  console.log(`  Valid UUID format: ${itemsStats.valid_uuid_count}`);
  console.log(`  Invalid UUID format: ${itemsStats.invalid_uuid_count}`);
  console.log(`  Distinct values: ${itemsStats.distinct_values}`);
  console.log('');

  // Check for invalid UUIDs
  if (parseInt(itemsStats.invalid_uuid_count) > 0) {
    console.log('⚠️  Found invalid UUID values! Showing samples:\n');
    const invalidQuery = `
      SELECT DISTINCT operator_id, COUNT(*) as count
      FROM itinerary_items
      WHERE operator_id IS NOT NULL 
        AND NOT (operator_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
      GROUP BY operator_id
      LIMIT 10
    `;
    const invalidResult = await invokeQuery(invalidQuery, []);
    invalidResult.rows.forEach((row: any) => {
      console.log(`  "${row.operator_id}" (appears ${row.count} times)`);
    });
    console.log('');
  }

  // Step 2: Check activity_packages table
  console.log('='.repeat(80));
  console.log('\n📦 Step 2: Analyzing activity_packages.operator_id data...\n');
  
  const activityPackagesQuery = `
    SELECT 
      COUNT(*) as total_rows,
      COUNT(operator_id) as non_null_count,
      COUNT(*) - COUNT(operator_id) as null_count,
      COUNT(CASE 
        WHEN operator_id IS NOT NULL AND 
             operator_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 1 
      END) as valid_uuid_count,
      COUNT(CASE 
        WHEN operator_id IS NOT NULL AND 
             NOT (operator_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') 
        THEN 1 
      END) as invalid_uuid_count,
      COUNT(DISTINCT operator_id) as distinct_values
    FROM activity_packages
  `;

  const activityPackagesResult = await invokeQuery(activityPackagesQuery, []);
  const packagesStats = activityPackagesResult.rows[0];
  
  console.log('activity_packages.operator_id Statistics:');
  console.log(`  Total rows: ${packagesStats.total_rows}`);
  console.log(`  Non-null values: ${packagesStats.non_null_count}`);
  console.log(`  NULL values: ${packagesStats.null_count}`);
  console.log(`  Valid UUID format: ${packagesStats.valid_uuid_count}`);
  console.log(`  Invalid UUID format: ${packagesStats.invalid_uuid_count}`);
  console.log(`  Distinct values: ${packagesStats.distinct_values}`);
  console.log('');

  // Step 3: Check if operator_ids reference valid users
  console.log('='.repeat(80));
  console.log('\n👤 Step 3: Checking if operator_ids reference valid users...\n');
  
  const foreignKeyCheckQuery = `
    SELECT 
      COUNT(DISTINCT ii.operator_id) as distinct_operator_ids,
      COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN ii.operator_id END) as valid_references,
      COUNT(DISTINCT CASE WHEN u.id IS NULL AND ii.operator_id IS NOT NULL THEN ii.operator_id END) as invalid_references
    FROM itinerary_items ii
    LEFT JOIN users u ON ii.operator_id::text = u.id::text
  `;

  const fkResult = await invokeQuery(foreignKeyCheckQuery, []);
  const fkStats = fkResult.rows[0];
  
  console.log('Foreign Key Reference Check (itinerary_items → users):');
  console.log(`  Distinct operator_ids: ${fkStats.distinct_operator_ids}`);
  console.log(`  Valid references (exist in users): ${fkStats.valid_references}`);
  console.log(`  Invalid references (missing in users): ${fkStats.invalid_references}`);
  console.log('');

  // Step 4: Check for foreign key constraints
  console.log('='.repeat(80));
  console.log('\n🔗 Step 4: Checking existing foreign key constraints...\n');
  
  const constraintQuery = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND (tc.table_name = 'itinerary_items' OR tc.table_name = 'activity_packages')
      AND (kcu.column_name = 'operator_id' OR ccu.column_name = 'id')
    ORDER BY tc.table_name, kcu.column_name
  `;

  const constraintResult = await invokeQuery(constraintQuery, []);
  
  if (constraintResult.rows && constraintResult.rows.length > 0) {
    console.log('Existing Foreign Key Constraints:');
    constraintResult.rows.forEach((fk: any) => {
      console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      console.log(`    Constraint: ${fk.constraint_name}`);
      console.log(`    On Delete: ${fk.delete_rule || 'NO ACTION'}`);
      console.log(`    On Update: ${fk.update_rule || 'NO ACTION'}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No foreign key constraints found');
    console.log('   This means there are no enforced referential integrity constraints');
    console.log('   Converting to UUID would allow adding FK constraints');
    console.log('');
  }

  // Step 5: Check column nullability
  console.log('='.repeat(80));
  console.log('\n📋 Step 5: Checking column nullability and defaults...\n');
  
  const nullabilityQuery = `
    SELECT 
      table_name,
      column_name,
      is_nullable,
      column_default,
      data_type,
      udt_name
    FROM information_schema.columns
    WHERE (table_name = 'itinerary_items' AND column_name = 'operator_id')
       OR (table_name = 'activity_packages' AND column_name = 'operator_id')
       OR (table_name = 'users' AND column_name = 'id')
    ORDER BY table_name, column_name
  `;

  const nullabilityResult = await invokeQuery(nullabilityQuery, []);
  
  console.log('Column Definitions:');
  nullabilityResult.rows.forEach((col: any) => {
    console.log(`  ${col.table_name}.${col.column_name}:`);
    console.log(`    Type: ${col.udt_name || col.data_type}`);
    console.log(`    Nullable: ${col.is_nullable}`);
    console.log(`    Default: ${col.column_default || 'None'}`);
    console.log('');
  });

  // Step 6: Check for indexes
  console.log('='.repeat(80));
  console.log('\n📇 Step 6: Checking indexes on operator_id columns...\n');
  
  const indexQuery = `
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename IN ('itinerary_items', 'activity_packages', 'users')
      AND indexdef LIKE '%operator_id%'
    ORDER BY tablename, indexname
  `;

  const indexResult = await invokeQuery(indexQuery, []);
  
  if (indexResult.rows && indexResult.rows.length > 0) {
    console.log('Indexes on operator_id columns:');
    indexResult.rows.forEach((idx: any) => {
      console.log(`  ${idx.tablename}.${idx.indexname}:`);
      console.log(`    ${idx.indexdef}`);
      console.log('');
    });
  } else {
    console.log('No indexes found on operator_id columns');
    console.log('');
  }

  // Summary and Recommendations
  console.log('='.repeat(80));
  console.log('\n📝 BACKWARD COMPATIBILITY ANALYSIS\n');
  console.log('='.repeat(80));
  
  const hasInvalidUUIDs = parseInt(itemsStats.invalid_uuid_count) > 0 || parseInt(packagesStats.invalid_uuid_count) > 0;
  const hasNulls = parseInt(itemsStats.null_count) > 0 || parseInt(packagesStats.null_count) > 0;
  const hasInvalidRefs = parseInt(fkStats.invalid_references) > 0;
  
  console.log('✅ SAFE TO CONVERT if:');
  console.log(`   - All operator_id values are valid UUIDs: ${!hasInvalidUUIDs ? '✅ YES' : '❌ NO'}`);
  console.log(`   - NULL values are acceptable or will be handled: ${hasNulls ? '⚠️  HAS NULLS' : '✅ NO NULLS'}`);
  console.log(`   - All references point to valid users: ${!hasInvalidRefs ? '✅ YES' : '❌ NO'}`);
  console.log('');
  
  console.log('⚠️  CONVERSION REQUIREMENTS:');
  console.log('   1. All TEXT values must be valid UUID format');
  console.log('   2. NULL values must be allowed (or set to NOT NULL with default)');
  console.log('   3. Need to update both itinerary_items AND activity_packages');
  console.log('   4. Need to add foreign key constraint: itinerary_items.operator_id → users.id');
  console.log('   5. Need to update all code that treats operator_id as TEXT');
  console.log('');
  
  if (hasInvalidUUIDs) {
    console.log('❌ BLOCKER: Invalid UUID values found!');
    console.log('   Must clean up invalid data before conversion.');
    console.log('');
  }
  
  if (hasInvalidRefs) {
    console.log('⚠️  WARNING: Some operator_ids reference non-existent users');
    console.log('   Foreign key constraint will fail if added without cleanup.');
    console.log('');
  }
  
  console.log('🔄 MIGRATION STEPS (if converting):');
  console.log('   1. Clean up invalid UUID values (if any)');
  console.log('   2. Clean up invalid user references (if any)');
  console.log('   3. Convert activity_packages.operator_id TEXT → UUID');
  console.log('   4. Convert itinerary_items.operator_id TEXT → UUID');
  console.log('   5. Add foreign key constraint: itinerary_items.operator_id → users.id');
  console.log('   6. Update code to remove TEXT casts');
  console.log('   7. Test all queries and inserts');
  console.log('');
}

checkCompatibility().catch((error) => {
  console.error('❌ Compatibility check failed:', error);
  process.exit(1);
});

