/**
 * Script to add query_id column to itineraries table
 * This fixes the missing column error
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Configure AWS credentials from environment variables
const client = new LambdaClient({ 
  region: AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
  } : undefined,
});

async function executeQuery(sql, params = []) {
  const payload = {
    action: 'query',
    query: sql,
    params: params,
  };

  const command = new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());

  if (result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(errorBody.message || errorBody.error || 'Lambda invocation failed');
  }

  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  return body;
}

async function main() {
  try {
    console.log('🔍 Checking itineraries table structure...');
    
    // Check if query_id column exists
    const checkColumns = await executeQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'itineraries' AND column_name = 'query_id'
    `);

    if (checkColumns.rows && checkColumns.rows.length > 0) {
      console.log('✅ query_id column already exists in itineraries table');
    } else {
      console.log('➕ Adding query_id column to itineraries table...');
      
      // Add query_id column (TEXT type to match RDS schema)
      await executeQuery(`
        ALTER TABLE itineraries 
        ADD COLUMN IF NOT EXISTS query_id TEXT
      `);

      console.log('✅ query_id column added successfully');
    }

    // Check if itinerary_id column exists in itinerary_queries
    console.log('🔍 Checking itinerary_queries table structure...');
    
    const checkQueryColumns = await executeQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'itinerary_queries' AND column_name = 'itinerary_id'
    `);

    if (checkQueryColumns.rows && checkQueryColumns.rows.length > 0) {
      console.log('✅ itinerary_id column already exists in itinerary_queries table');
    } else {
      console.log('➕ Adding itinerary_id column to itinerary_queries table...');
      
      // Add itinerary_id column (TEXT type to match RDS schema)
      await executeQuery(`
        ALTER TABLE itinerary_queries 
        ADD COLUMN IF NOT EXISTS itinerary_id TEXT
      `);

      console.log('✅ itinerary_id column added successfully');
    }

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    
    try {
      await executeQuery(`
        CREATE INDEX IF NOT EXISTS idx_itineraries_query_id 
        ON itineraries(query_id)
      `);
      console.log('✅ Index on itineraries.query_id created');
    } catch (err) {
      console.log('⚠️  Index creation skipped (may already exist):', err.message);
    }

    try {
      await executeQuery(`
        CREATE INDEX IF NOT EXISTS idx_itinerary_queries_itinerary_id 
        ON itinerary_queries(itinerary_id)
      `);
      console.log('✅ Index on itinerary_queries.itinerary_id created');
    } catch (err) {
      console.log('⚠️  Index creation skipped (may already exist):', err.message);
    }

    try {
      await executeQuery(`
        CREATE INDEX IF NOT EXISTS idx_itinerary_queries_lead_agent 
        ON itinerary_queries(lead_id, agent_id)
      `);
      console.log('✅ Index on itinerary_queries(lead_id, agent_id) created');
    } catch (err) {
      console.log('⚠️  Index creation skipped (may already exist):', err.message);
    }

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();



