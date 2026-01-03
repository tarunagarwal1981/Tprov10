/**
 * Backup all operator_id values before migration
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

async function backupOperatorIds() {
  console.log('💾 Backing up operator_id values before migration...\n');
  console.log('='.repeat(80));

  const tables = [
    'activity_packages',
    'itinerary_items',
    'transfer_packages',
    'multi_city_packages',
    'multi_city_hotel_packages',
    'fixed_departure_flight_packages',
  ];

  const backup: any = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  for (const tableName of tables) {
    try {
      console.log(`📋 Backing up ${tableName}...`);
      
      const query = `SELECT id, operator_id FROM ${tableName} ORDER BY id`;
      const result = await invokeQuery(query, []);
      
      backup.tables[tableName] = {
        rowCount: result.rows?.length || 0,
        rows: result.rows || [],
      };
      
      console.log(`   ✅ Backed up ${result.rows?.length || 0} rows`);
    } catch (error: any) {
      console.log(`   ⚠️  Error backing up ${tableName}: ${error.message}`);
      backup.tables[tableName] = {
        error: error.message,
        rowCount: 0,
        rows: [],
      };
    }
  }

  // Save backup to file
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `operator_ids_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  console.log('='.repeat(80));
  console.log('\n✅ Backup complete!');
  console.log(`   File: ${backupFile}`);
  console.log('');
  
  const totalRows = Object.values(backup.tables).reduce((sum: number, table: any) => sum + (table.rowCount || 0), 0);
  console.log(`   Total rows backed up: ${totalRows}`);
  console.log('');
}

backupOperatorIds().catch((error) => {
  console.error('❌ Backup failed:', error);
  process.exit(1);
});

