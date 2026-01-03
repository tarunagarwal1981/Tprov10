/**
 * Pre-Migration: Cleanup invalid operator_id references before converting to UUID
 * Fixes invalid user references in itinerary_items table
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

async function cleanupInvalidReferences() {
  console.log('🔍 Pre-Migration: Cleaning up invalid operator_id references...\n');
  console.log('='.repeat(80));

  // Step 1: Find invalid operator_id references in itinerary_items
  console.log('\n📋 Step 1: Finding invalid operator_id references...\n');
  
  const invalidRefsQuery = `
    SELECT 
      ii.id,
      ii.operator_id,
      ii.package_type,
      ii.package_id,
      CASE WHEN u.id IS NOT NULL THEN 'VALID' ELSE 'INVALID' END as reference_status
    FROM itinerary_items ii
    LEFT JOIN users u ON ii.operator_id::text = u.id::text
    WHERE u.id IS NULL AND ii.operator_id IS NOT NULL
    ORDER BY ii.id
  `;

  const invalidRefs = await invokeQuery(invalidRefsQuery, []);
  
  if (!invalidRefs.rows || invalidRefs.rows.length === 0) {
    console.log('✅ No invalid operator_id references found!');
    return;
  }

  console.log(`⚠️  Found ${invalidRefs.rows.length} invalid operator_id references:\n`);
  invalidRefs.rows.forEach((item: any, index: number) => {
    console.log(`${index + 1}. Itinerary Item: ${item.id}`);
    console.log(`   Operator ID: ${item.operator_id}`);
    console.log(`   Package Type: ${item.package_type}`);
    console.log(`   Package ID: ${item.package_id}`);
    console.log('');
  });

  // Step 2: Try to find correct operator_id from package tables
  console.log('='.repeat(80));
  console.log('\n🔍 Step 2: Attempting to find correct operator_id from package tables...\n');

  const fixes: Array<{ itemId: string; oldOperatorId: string; newOperatorId: string | null; source: string }> = [];

  for (const item of invalidRefs.rows) {
    let foundOperatorId: string | null = null;
    let source = '';

    // Try to find operator_id from the package
    if (item.package_type === 'activity') {
      const pkgQuery = `SELECT operator_id FROM activity_packages WHERE id::text = $1 LIMIT 1`;
      try {
        const pkgResult = await invokeQuery(pkgQuery, [item.package_id]);
        if (pkgResult.rows && pkgResult.rows.length > 0) {
          foundOperatorId = pkgResult.rows[0].operator_id;
          source = 'activity_packages';
        }
      } catch (e) {
        // Package not found or error
      }
    } else if (item.package_type === 'transfer') {
      const pkgQuery = `SELECT operator_id FROM transfer_packages WHERE id::text = $1 LIMIT 1`;
      try {
        const pkgResult = await invokeQuery(pkgQuery, [item.package_id]);
        if (pkgResult.rows && pkgResult.rows.length > 0) {
          foundOperatorId = pkgResult.rows[0].operator_id;
          source = 'transfer_packages';
        }
      } catch (e) {
        // Package not found or error
      }
    } else if (item.package_type === 'multi_city') {
      const pkgQuery = `SELECT operator_id FROM multi_city_packages WHERE id::text = $1 LIMIT 1`;
      try {
        const pkgResult = await invokeQuery(pkgQuery, [item.package_id]);
        if (pkgResult.rows && pkgResult.rows.length > 0) {
          foundOperatorId = pkgResult.rows[0].operator_id;
          source = 'multi_city_packages';
        }
      } catch (e) {
        // Package not found or error
      }
    } else if (item.package_type === 'multi_city_hotel') {
      const pkgQuery = `SELECT operator_id FROM multi_city_hotel_packages WHERE id::text = $1 LIMIT 1`;
      try {
        const pkgResult = await invokeQuery(pkgQuery, [item.package_id]);
        if (pkgResult.rows && pkgResult.rows.length > 0) {
          foundOperatorId = pkgResult.rows[0].operator_id;
          source = 'multi_city_hotel_packages';
        }
      } catch (e) {
        // Package not found or error
      }
    } else if (item.package_type === 'fixed_departure') {
      const pkgQuery = `SELECT operator_id FROM fixed_departure_flight_packages WHERE id::text = $1 LIMIT 1`;
      try {
        const pkgResult = await invokeQuery(pkgQuery, [item.package_id]);
        if (pkgResult.rows && pkgResult.rows.length > 0) {
          foundOperatorId = pkgResult.rows[0].operator_id;
          source = 'fixed_departure_flight_packages';
        }
      } catch (e) {
        // Package not found or error
      }
    }

    // Verify the found operator_id exists in users table
    if (foundOperatorId) {
      const userCheck = await invokeQuery(
        `SELECT id FROM users WHERE id::text = $1::text LIMIT 1`,
        [foundOperatorId]
      );
      
      if (userCheck.rows && userCheck.rows.length > 0) {
        fixes.push({
          itemId: item.id,
          oldOperatorId: item.operator_id,
          newOperatorId: foundOperatorId,
          source,
        });
      } else {
        console.log(`⚠️  Found operator_id ${foundOperatorId} from ${source} but it doesn't exist in users table`);
        fixes.push({
          itemId: item.id,
          oldOperatorId: item.operator_id,
          newOperatorId: null,
          source: 'NOT_FOUND',
        });
      }
    } else {
      fixes.push({
        itemId: item.id,
        oldOperatorId: item.operator_id,
        newOperatorId: null,
        source: 'NOT_FOUND',
      });
    }
  }

  // Step 3: Apply fixes
  console.log('='.repeat(80));
  console.log('\n🔧 Step 3: Applying fixes...\n');

  let fixedCount = 0;
  let nullifiedCount = 0;
  let failedCount = 0;

  for (const fix of fixes) {
    if (fix.newOperatorId) {
      try {
        await invokeQuery(
          `UPDATE itinerary_items SET operator_id = $1::text WHERE id::text = $2`,
          [fix.newOperatorId, fix.itemId]
        );
        console.log(`✅ Fixed item ${fix.itemId}: ${fix.oldOperatorId} → ${fix.newOperatorId} (from ${fix.source})`);
        fixedCount++;
      } catch (error: any) {
        console.error(`❌ Failed to fix item ${fix.itemId}: ${error.message}`);
        failedCount++;
      }
    } else {
      // If we can't find a valid operator_id, we have two options:
      // 1. Set to NULL (if column allows)
      // 2. Set to a default operator (if exists)
      
      // Try to get a default operator (first operator in users table)
      try {
        const defaultOp = await invokeQuery(
          `SELECT id FROM users WHERE role = 'OPERATOR' OR role = 'TOUR_OPERATOR' LIMIT 1`
        );
        
        if (defaultOp.rows && defaultOp.rows.length > 0) {
          const defaultOperatorId = defaultOp.rows[0].id;
          await invokeQuery(
            `UPDATE itinerary_items SET operator_id = $1::text WHERE id::text = $2`,
            [defaultOperatorId, fix.itemId]
          );
          console.log(`⚠️  Item ${fix.itemId}: Set to default operator ${defaultOperatorId} (original: ${fix.oldOperatorId})`);
          fixedCount++;
        } else {
          // Set to NULL if column allows
          await invokeQuery(
            `UPDATE itinerary_items SET operator_id = NULL WHERE id::text = $1`,
            [fix.itemId]
          );
          console.log(`⚠️  Item ${fix.itemId}: Set to NULL (original: ${fix.oldOperatorId} - no valid operator found)`);
          nullifiedCount++;
        }
      } catch (error: any) {
        console.error(`❌ Failed to handle item ${fix.itemId}: ${error.message}`);
        failedCount++;
      }
    }
  }

  // Step 4: Verify fixes
  console.log('='.repeat(80));
  console.log('\n✅ Step 4: Verifying fixes...\n');

  const verifyQuery = `
    SELECT COUNT(*) as invalid_count
    FROM itinerary_items ii
    LEFT JOIN users u ON ii.operator_id::text = u.id::text
    WHERE u.id IS NULL AND ii.operator_id IS NOT NULL
  `;

  const verifyResult = await invokeQuery(verifyQuery, []);
  const remainingInvalid = parseInt(verifyResult.rows[0]?.invalid_count || '0');

  console.log('='.repeat(80));
  console.log('\n📊 CLEANUP SUMMARY\n');
  console.log('='.repeat(80));
  console.log(`Total invalid references found: ${invalidRefs.rows.length}`);
  console.log(`Fixed with valid operator_id: ${fixedCount}`);
  console.log(`Set to NULL: ${nullifiedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Remaining invalid: ${remainingInvalid}`);
  console.log('');

  if (remainingInvalid > 0) {
    console.log('⚠️  WARNING: Some invalid references remain!');
    console.log('   These must be fixed before adding foreign key constraint.');
    console.log('');
  } else {
    console.log('✅ All invalid references have been fixed!');
    console.log('   Safe to proceed with UUID migration.');
    console.log('');
  }
}

cleanupInvalidReferences().catch((error) => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});

