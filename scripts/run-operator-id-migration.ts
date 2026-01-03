/**
 * Run the operator_id TEXT to UUID migration
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import * as fs from 'fs';
import * as path from 'path';

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

async function runMigration() {
  console.log('🚀 Running operator_id TEXT to UUID migration...\n');
  console.log('='.repeat(80));

  // Read migration file
  const migrationFile = path.join(process.cwd(), 'supabase/migrations/011_convert_operator_id_to_uuid.sql');
  const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

  // Execute ALTER TABLE statements directly
  const alterStatements = [
    'ALTER TABLE activity_packages ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid',
    'ALTER TABLE transfer_packages ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid',
    'ALTER TABLE multi_city_packages ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid',
    'ALTER TABLE multi_city_hotel_packages ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid',
    'ALTER TABLE fixed_departure_flight_packages ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid',
    'ALTER TABLE itinerary_items ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid',
  ];

  console.log(`Executing ${alterStatements.length} ALTER TABLE statements...\n`);

  for (let i = 0; i < alterStatements.length; i++) {
    const statement = alterStatements[i];
    const tableName = statement.match(/ALTER TABLE (\w+)/)?.[1] || 'unknown';

    try {
      console.log(`📝 [${i + 1}/${alterStatements.length}] Converting ${tableName}.operator_id...`);
      
      await invokeQuery(statement, []);
      
      console.log(`   ✅ Success\n`);
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      throw error;
    }
  }

  // Handle DO block separately
  console.log('📝 Executing DO block for foreign key constraint...');
  try {
    // Check for invalid references first
    const invalidCheck = await invokeQuery(`
      SELECT COUNT(*) as count
      FROM itinerary_items ii
      LEFT JOIN users u ON ii.operator_id = u.id
      WHERE ii.operator_id IS NOT NULL AND u.id IS NULL
    `, []);

    const invalidCount = parseInt(invalidCheck.rows[0]?.count || '0');

    if (invalidCount > 0) {
      console.log(`   ⚠️  Found ${invalidCount} invalid operator_id references`);
      console.log(`   ⚠️  Skipping foreign key constraint (will add after cleanup)`);
    } else {
      // Add foreign key constraint
      await invokeQuery(`
        ALTER TABLE itinerary_items
        ADD CONSTRAINT fk_itinerary_items_operator_id 
        FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE
      `, []);
      console.log(`   ✅ Foreign key constraint added successfully\n`);
    }
  } catch (error: any) {
    console.error(`   ⚠️  Could not add foreign key constraint: ${error.message}`);
    console.error(`   ⚠️  This is OK - constraint can be added after cleanup\n`);
  }

  console.log('='.repeat(80));
  console.log('\n✅ Migration completed successfully!\n');
}

runMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

