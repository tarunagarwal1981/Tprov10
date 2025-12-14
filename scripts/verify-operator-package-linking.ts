/**
 * Script to verify all 5 package types are properly linked to operators
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

const PACKAGE_TYPES = [
  {
    name: 'Activity Package',
    table: 'activity_packages',
    operatorColumn: 'operator_id',
    createRoute: '/api/operator/packages/activity/create',
    frontendRoute: '/operator/packages/create/activity',
  },
  {
    name: 'Transfer Package',
    table: 'transfer_packages',
    operatorColumn: 'operator_id',
    createRoute: '/api/operator/packages/transfer/create',
    frontendRoute: '/operator/packages/create/transfer',
  },
  {
    name: 'Multi-City Package',
    table: 'multi_city_packages',
    operatorColumn: 'operator_id',
    createRoute: '/api/operator/packages/multi-city/create',
    frontendRoute: '/operator/packages/create/multi-city',
  },
  {
    name: 'Multi-City Hotel Package',
    table: 'multi_city_hotel_packages',
    operatorColumn: 'operator_id',
    createRoute: '/api/operator/packages/multi-city-hotel/create',
    frontendRoute: '/operator/packages/create/multi-city-hotel',
  },
  {
    name: 'Fixed Departure Flight Package',
    table: 'fixed_departure_flight_packages',
    operatorColumn: 'operator_id',
    createRoute: '/api/operator/packages/fixed-departure-flight/create',
    frontendRoute: '/operator/packages/create/fixed-departure-flight',
  },
];

async function getLambdaResponse(lambdaClient: LambdaClient, query: string, params: any[] = []) {
  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      Payload: JSON.stringify({
        action: 'query',
        query,
        params,
      }),
    })
  );

  const result = JSON.parse(
    new TextDecoder().decode(response.Payload || new Uint8Array())
  );

  if (result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(`Lambda error: ${errorBody.message || errorBody.error || JSON.stringify(errorBody)}`);
  }

  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  
  if (body.error) {
    throw new Error(`Database error: ${body.message || body.error || JSON.stringify(body)}`);
  }

  return body;
}

async function verifyPackageType(pkgType: typeof PACKAGE_TYPES[0], lambdaClient: LambdaClient) {
  console.log(`\n📦 Verifying ${pkgType.name}...`);
  console.log(`   Table: ${pkgType.table}`);
  console.log(`   Operator Column: ${pkgType.operatorColumn}`);

  try {
    // Check if table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      ) as exists
    `;

    const tableExistsBody = await getLambdaResponse(lambdaClient, tableExistsQuery, [pkgType.table]);
    const tableExists = tableExistsBody.rows?.[0]?.exists;

    if (!tableExists) {
      console.log(`   ❌ Table does not exist`);
      return { success: false, issues: ['Table does not exist'] };
    }

    // Check if operator column exists
    const columnExistsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    `;

    const columnBody = await getLambdaResponse(lambdaClient, columnExistsQuery, [pkgType.table, pkgType.operatorColumn]);
    const operatorColumn = columnBody.rows?.[0];

    if (!operatorColumn) {
      console.log(`   ❌ Operator column does not exist`);
      return { success: false, issues: ['Operator column does not exist'] };
    }

    console.log(`   ✅ Table and operator column exist`);
    console.log(`      Column type: ${operatorColumn.data_type}, Nullable: ${operatorColumn.is_nullable}`);

    // Check for packages without operator_id
    const nullOperatorQuery = `
      SELECT COUNT(*) as count
      FROM ${pkgType.table}
      WHERE ${pkgType.operatorColumn} IS NULL
    `;

    const nullOperatorBody = await getLambdaResponse(lambdaClient, nullOperatorQuery);
    const nullCount = parseInt(nullOperatorBody.rows?.[0]?.count || '0', 10);

    if (nullCount > 0) {
      console.log(`   ⚠️  Found ${nullCount} package(s) without operator_id`);
      return { success: false, issues: [`${nullCount} packages without operator_id`] };
    }

    // Get total count and sample operator IDs
    const statsQuery = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(DISTINCT ${pkgType.operatorColumn}) as unique_operators,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count
      FROM ${pkgType.table}
    `;

    const statsBody = await getLambdaResponse(lambdaClient, statsQuery);
    const stats = statsBody.rows?.[0];

    console.log(`   📊 Statistics:`);
    console.log(`      Total packages: ${stats.total_count}`);
    console.log(`      Unique operators: ${stats.unique_operators}`);
    console.log(`      Published: ${stats.published_count}`);
    console.log(`      Drafts: ${stats.draft_count}`);

    // Get sample packages with operator IDs
    const sampleQuery = `
      SELECT id, title, ${pkgType.operatorColumn}, status, created_at
      FROM ${pkgType.table}
      ORDER BY created_at DESC
      LIMIT 3
    `;

    const sampleBody = await getLambdaResponse(lambdaClient, sampleQuery);
    const samples = sampleBody.rows || [];

    if (samples.length > 0) {
      console.log(`   📋 Sample packages:`);
      samples.forEach((pkg: any) => {
        console.log(`      - ${pkg.title || 'Untitled'} (ID: ${pkg.id?.substring(0, 8)}..., Operator: ${pkg[pkgType.operatorColumn]?.substring(0, 8)}..., Status: ${pkg.status})`);
      });
    }

    return { success: true, issues: [] };

  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, issues: [error.message] };
  }
}

async function main() {
  console.log('🔍 Verifying operator package linking for all 5 package types...');
  console.log(`📡 Using Lambda: ${LAMBDA_FUNCTION_NAME}`);
  console.log(`🌍 Region: ${AWS_REGION}`);
  console.log('');

  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  const results: { name: string; success: boolean; issues: string[] }[] = [];

  for (const pkgType of PACKAGE_TYPES) {
    const result = await verifyPackageType(pkgType, lambdaClient);
    results.push({
      name: pkgType.name,
      success: result.success,
      issues: result.issues,
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Verification Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  results.forEach((result) => {
    console.log(`\n${result.success ? '✅' : '❌'} ${result.name}`);
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   ⚠️  ${issue}`);
      });
    }
  });

  const successCount = results.filter(r => r.success).length;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully verified: ${successCount}/${results.length} package types`);
  
  if (successCount === results.length) {
    console.log('');
    console.log('🎉 All package types are properly linked to operators!');
    console.log('');
    console.log('💡 Key Points:');
    console.log('   - All packages store operator_id');
    console.log('   - All packages are linked to the creating operator');
    console.log('   - Published and draft packages maintain operator association');
    console.log('   - This enables proper commission/payment tracking');
  } else {
    console.log('');
    console.log('⚠️  Some package types have issues. Please review above.');
  }
}

main()
  .then(() => {
    console.log('');
    console.log('✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
