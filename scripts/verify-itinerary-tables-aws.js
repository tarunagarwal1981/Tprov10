/**
 * Verify Itinerary Tables in AWS RDS using Lambda Database Service
 * 
 * This script uses AWS SDK to invoke the Lambda database service
 * to verify all required tables exist in AWS RDS.
 * 
 * Prerequisites:
 * - AWS credentials configured (via environment variables, IAM role, or ~/.aws/credentials)
 * - Lambda function name set in DATABASE_LAMBDA_NAME environment variable
 * 
 * Usage:
 *   node scripts/verify-itinerary-tables-aws.js
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1';

const lambdaClient = new LambdaClient({ region: AWS_REGION });

/**
 * Invoke Lambda database service
 */
async function invokeLambda(action, query, params) {
  const command = new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify({
      action,
      query,
      params,
    }),
  });

  const response = await lambdaClient.send(command);
  
  if (!response.Payload) {
    throw new Error('Lambda returned no payload');
  }

  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  if (result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(errorBody.message || errorBody.error || 'Lambda invocation failed');
  }

  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  return body;
}

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  try {
    const result = await invokeLambda(
      'query',
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists`,
      [tableName]
    );
    return result.rows[0]?.exists === true;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Check if a column exists in a table
 */
async function columnExists(tableName, columnName) {
  try {
    const result = await invokeLambda(
      'query',
      `SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
      ) as exists`,
      [tableName, columnName]
    );
    return result.rows[0]?.exists === true;
  } catch (error) {
    console.error(`Error checking column ${tableName}.${columnName}:`, error.message);
    return false;
  }
}

/**
 * Main verification function
 */
async function verifyTables() {
  console.log('🔍 Verifying itinerary-related tables in AWS RDS...');
  console.log(`📡 Using Lambda: ${LAMBDA_FUNCTION_NAME} in region: ${AWS_REGION}\n`);

  const requiredTables = [
    // Itinerary tables
    'itineraries',
    'itinerary_days',
    'itinerary_items',
    
    // Multi-city package tables
    'multi_city_packages',
    'multi_city_hotel_packages',
    'multi_city_pricing_packages',
    'multi_city_hotel_pricing_packages',
    'multi_city_pricing_rows',
    'multi_city_hotel_pricing_rows',
    'multi_city_private_package_rows',
    'multi_city_hotel_private_package_rows',
    'multi_city_package_day_plans',
    'multi_city_hotel_package_day_plans',
    'multi_city_package_cities',
    'multi_city_hotel_package_cities',
    'multi_city_hotel_package_city_hotels',
    'multi_city_package_images',
    'multi_city_hotel_package_images',
  ];

  const results = {
    exists: [],
    missing: [],
    hasTimeSlots: false,
  };

  // Test Lambda connection first
  try {
    const testResult = await invokeLambda('test');
    console.log(`✅ Lambda connection successful (DB time: ${testResult.time})\n`);
  } catch (error) {
    console.error('❌ Failed to connect to Lambda database service:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. AWS credentials are configured');
    console.error('   2. DATABASE_LAMBDA_NAME environment variable is set');
    console.error('   3. Lambda function exists and is accessible');
    process.exit(1);
  }

  // Check each table
  for (const tableName of requiredTables) {
    const exists = await tableExists(tableName);
    
    if (exists) {
      results.exists.push(tableName);
      console.log(`✅ ${tableName} - EXISTS`);

      // Check for time_slots column if it's itinerary_days
      if (tableName === 'itinerary_days') {
        const hasTimeSlots = await columnExists(tableName, 'time_slots');
        results.hasTimeSlots = hasTimeSlots;
        
        if (hasTimeSlots) {
          console.log(`   ✅ time_slots column exists`);
        } else {
          console.log(`   ⚠️  time_slots column missing (backward compatible)`);
        }
      }
    } else {
      results.missing.push(tableName);
      console.log(`❌ ${tableName} - MISSING`);
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`✅ Tables found: ${results.exists.length}/${requiredTables.length}`);
  console.log(`❌ Tables missing: ${results.missing.length}`);
  console.log(`✅ time_slots column: ${results.hasTimeSlots ? 'EXISTS' : 'MISSING (backward compatible)'}`);

  if (results.missing.length > 0) {
    console.log('\n⚠️  Missing tables:');
    results.missing.forEach(table => console.log(`   - ${table}`));
    console.log('\n💡 Run migrations to create missing tables.');
    console.log('   Use: ./scripts/migrate-itinerary-tables.sh');
  }

  if (!results.hasTimeSlots && results.exists.includes('itinerary_days')) {
    console.log('\n💡 Note: time_slots column is missing but code handles this gracefully.');
    console.log('   To add it, run migration: supabase/migrations/017_enhance_itinerary_days.sql');
  }

  return results;
}

// Run verification
verifyTables()
  .then((results) => {
    if (results.missing.length === 0) {
      console.log('\n✅ All required tables exist!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tables are missing. Please run migrations.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });

