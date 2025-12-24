/**
 * Test Database Connection via Lambda
 * Verifies AWS Lambda connection and database access
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔌 Testing database connection via AWS Lambda\n');

  const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
    } : undefined,
  });

  const lambdaName = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

  console.log(`📡 Lambda function: ${lambdaName}`);
  console.log(`🌍 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`🔑 Credentials: ${process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET (using default provider)'}\n`);

  try {
    // Test 1: Simple query
    console.log('Test 1: Simple SELECT query...');
    const testQuery = 'SELECT NOW() as current_time, version() as pg_version';
    
    const command = new InvokeCommand({
      FunctionName: lambdaName,
      Payload: JSON.stringify({
        action: 'query',
        query: testQuery,
        params: [],
      }),
    });

    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());

    if (result.statusCode !== 200) {
      const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      throw new Error(errorBody.error || errorBody.message || 'Lambda returned error');
    }

    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    console.log('✅ Connection successful!');
    console.log('   Current time:', body.rows?.[0]?.current_time);
    console.log('   PostgreSQL version:', body.rows?.[0]?.pg_version?.substring(0, 50) + '...\n');

    // Test 2: Check if itinerary_days table exists
    console.log('Test 2: Check itinerary_days table structure...');
    const checkTableQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'itinerary_days'
      ORDER BY ordinal_position
    `;

    const checkCommand = new InvokeCommand({
      FunctionName: lambdaName,
      Payload: JSON.stringify({
        action: 'query',
        query: checkTableQuery,
        params: [],
      }),
    });

    const checkResponse = await lambdaClient.send(checkCommand);
    const checkResult = JSON.parse(Buffer.from(checkResponse.Payload).toString());

    if (checkResult.statusCode === 200) {
      const checkBody = typeof checkResult.body === 'string' ? JSON.parse(checkResult.body) : checkResult.body;
      const columns = checkBody.rows || [];
      
      if (columns.length === 0) {
        console.log('⚠️  itinerary_days table does not exist');
      } else {
        console.log(`✅ itinerary_days table exists with ${columns.length} columns:`);
        columns.forEach((col) => {
          console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
        
        // Check for enhanced fields
        const enhancedFields = [
          'time_slots', 'arrival_flight_id', 'arrival_time', 'departure_flight_id', 'departure_time',
          'hotel_id', 'hotel_name', 'hotel_star_rating', 'room_type', 'meal_plan',
          'lunch_included', 'lunch_details', 'dinner_included', 'dinner_details', 'arrival_description'
        ];
        
        const existingFields = columns.map((c) => c.column_name);
        const missingFields = enhancedFields.filter(f => !existingFields.includes(f));
        
        if (missingFields.length > 0) {
          console.log(`\n⚠️  Missing enhanced fields (${missingFields.length}):`);
          missingFields.forEach(field => console.log(`   - ${field}`));
          console.log('\n💡 Run migration: node scripts/run-itinerary-days-migration.js');
        } else {
          console.log('\n✅ All enhanced fields are present!');
        }
      }
    }

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('   Error:', error.message);
    
    if (error.name === 'AccessDeniedException') {
      console.error('\n💡 Check:');
      console.error('   1. AWS credentials are correct');
      console.error('   2. IAM permissions allow Lambda invocation');
    } else if (error.name === 'ResourceNotFoundException') {
      console.error('\n💡 Check:');
      console.error('   1. Lambda function name is correct');
      console.error('   2. Lambda function exists in the specified region');
    }
    
    process.exit(1);
  }
}

testConnection();

