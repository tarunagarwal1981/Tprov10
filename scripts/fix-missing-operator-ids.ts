/**
 * Script to fix missing operator_ids in activities and transfers
 * 1. Find operator_id for operator@gmail.com
 * 2. Update all activities/transfers with missing operator_ids to use this operator_id
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

interface LambdaResponse {
  statusCode: number;
  body: string | any;
}

async function invokeQuery(sql: string, params: any[] = []): Promise<LambdaResponse> {
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

async function fixMissingOperatorIds() {
  console.log('🔧 Fixing Missing Operator IDs');
  console.log('='.repeat(80));
  console.log(`📡 Lambda: ${LAMBDA_FUNCTION_NAME}`);
  console.log(`🌍 Region: ${AWS_REGION}`);
  console.log('');

  try {
    // Step 1: Find operator_id for operator@gmail.com
    console.log('1️⃣ Finding operator_id for operator@gmail.com...');
    const operatorQuery = `
      SELECT id, email, name, role
      FROM users
      WHERE email = $1
      LIMIT 1
    `;
    
    const operatorResult = await invokeQuery(operatorQuery, ['operator@gmail.com']);
    
    if (!operatorResult.body.rows || operatorResult.body.rows.length === 0) {
      console.error('❌ Operator with email operator@gmail.com not found in users table');
      console.log('\nAvailable users:');
      const allUsers = await invokeQuery('SELECT id, email, name, role FROM users LIMIT 10', []);
      console.table(allUsers.body.rows || []);
      process.exit(1);
    }
    
    const operator = operatorResult.body.rows[0];
    const operatorId = operator.id;
    console.log('✅ Found operator:');
    console.table([operator]);
    console.log(`   Operator ID: ${operatorId}\n`);

    // Step 2: Find all activities with missing operator_ids
    console.log('2️⃣ Finding activities with missing operator_ids...');
    const missingActivitiesQuery = `
      SELECT DISTINCT ap.operator_id, COUNT(*) as activity_count
      FROM activity_packages ap
      LEFT JOIN users u ON ap.operator_id::text = u.id::text
      WHERE u.id IS NULL
        AND ap.operator_id IS NOT NULL
      GROUP BY ap.operator_id
      ORDER BY activity_count DESC
    `;
    
    const missingActivities = await invokeQuery(missingActivitiesQuery, []);
    console.log(`   Found ${missingActivities.body.rows.length} missing operator_ids in activities:`);
    if (missingActivities.body.rows.length > 0) {
      console.table(missingActivities.body.rows);
      
      const totalActivities = missingActivities.body.rows.reduce((sum: number, row: any) => 
        sum + parseInt(row.activity_count), 0
      );
      console.log(`   Total activities affected: ${totalActivities}\n`);
    } else {
      console.log('   ✅ No activities with missing operator_ids\n');
    }

    // Step 3: Find all transfers with missing operator_ids
    console.log('3️⃣ Finding transfers with missing operator_ids...');
    const missingTransfersQuery = `
      SELECT DISTINCT tp.operator_id, COUNT(*) as transfer_count
      FROM transfer_packages tp
      LEFT JOIN users u ON tp.operator_id::text = u.id::text
      WHERE u.id IS NULL
        AND tp.operator_id IS NOT NULL
      GROUP BY tp.operator_id
      ORDER BY transfer_count DESC
    `;
    
    const missingTransfers = await invokeQuery(missingTransfersQuery, []);
    console.log(`   Found ${missingTransfers.body.rows.length} missing operator_ids in transfers:`);
    if (missingTransfers.body.rows.length > 0) {
      console.table(missingTransfers.body.rows);
      
      const totalTransfers = missingTransfers.body.rows.reduce((sum: number, row: any) => 
        sum + parseInt(row.transfer_count), 0
      );
      console.log(`   Total transfers affected: ${totalTransfers}\n`);
    } else {
      console.log('   ✅ No transfers with missing operator_ids\n');
    }

    // Step 4: Update activities with missing operator_ids
    if (missingActivities.body.rows.length > 0) {
      console.log('4️⃣ Updating activities with missing operator_ids...');
      const updateActivitiesQuery = `
        UPDATE activity_packages
        SET operator_id = $1::text
        WHERE operator_id::text IN (
          SELECT DISTINCT ap.operator_id
          FROM activity_packages ap
          LEFT JOIN users u ON ap.operator_id::text = u.id::text
          WHERE u.id IS NULL
            AND ap.operator_id IS NOT NULL
        )
        RETURNING id, title, operator_id
      `;
      
      const updateActivitiesResult = await invokeQuery(updateActivitiesQuery, [operatorId]);
      console.log(`   ✅ Updated ${updateActivitiesResult.body.rowCount || 0} activities`);
      if (updateActivitiesResult.body.rows && updateActivitiesResult.body.rows.length > 0) {
        console.log('   Sample updated activities:');
        console.table(updateActivitiesResult.body.rows.slice(0, 5));
      }
      console.log('');
    }

    // Step 5: Update transfers with missing operator_ids
    if (missingTransfers.body.rows.length > 0) {
      console.log('5️⃣ Updating transfers with missing operator_ids...');
      const updateTransfersQuery = `
        UPDATE transfer_packages
        SET operator_id = $1::text
        WHERE operator_id::text IN (
          SELECT DISTINCT tp.operator_id
          FROM transfer_packages tp
          LEFT JOIN users u ON tp.operator_id::text = u.id::text
          WHERE u.id IS NULL
            AND tp.operator_id IS NOT NULL
        )
        RETURNING id, title, operator_id
      `;
      
      const updateTransfersResult = await invokeQuery(updateTransfersQuery, [operatorId]);
      console.log(`   ✅ Updated ${updateTransfersResult.body.rowCount || 0} transfers`);
      if (updateTransfersResult.body.rows && updateTransfersResult.body.rows.length > 0) {
        console.log('   Sample updated transfers:');
        console.table(updateTransfersResult.body.rows.slice(0, 5));
      }
      console.log('');
    }

    // Step 6: Verify the fix
    console.log('6️⃣ Verifying the fix...');
    const verifyActivitiesQuery = `
      SELECT COUNT(*) as count
      FROM activity_packages ap
      LEFT JOIN users u ON ap.operator_id::text = u.id::text
      WHERE u.id IS NULL
        AND ap.operator_id IS NOT NULL
    `;
    
    const verifyActivities = await invokeQuery(verifyActivitiesQuery, []);
    const remainingActivities = parseInt(verifyActivities.body.rows[0]?.count || '0', 10);
    
    const verifyTransfersQuery = `
      SELECT COUNT(*) as count
      FROM transfer_packages tp
      LEFT JOIN users u ON tp.operator_id::text = u.id::text
      WHERE u.id IS NULL
        AND tp.operator_id IS NOT NULL
    `;
    
    const verifyTransfers = await invokeQuery(verifyTransfersQuery, []);
    const remainingTransfers = parseInt(verifyTransfers.body.rows[0]?.count || '0', 10);
    
    console.log(`   Activities with missing operator_ids: ${remainingActivities}`);
    console.log(`   Transfers with missing operator_ids: ${remainingTransfers}`);
    
    if (remainingActivities === 0 && remainingTransfers === 0) {
      console.log('\n✅ All missing operator_ids have been fixed!');
    } else {
      console.log('\n⚠️  Some operator_ids are still missing. Please check manually.');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Script completed successfully');
    
  } catch (error: any) {
    console.error('\n❌ Error during fix:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the fix
fixMissingOperatorIds()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

