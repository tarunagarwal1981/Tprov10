import { Client } from 'pg';

const RDS_PASSWORD = process.env.RDS_PASSWORD || process.env.PGPASSWORD;
if (!RDS_PASSWORD) {
  console.error('❌ RDS_PASSWORD or PGPASSWORD environment variable is required');
  console.error('Please set it before running this script:');
  console.error('  export RDS_PASSWORD=your_password');
  process.exit(1);
}

const client = new Client({
  host: process.env.RDS_HOST || process.env.RDS_HOSTNAME || 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.RDS_PORT || '5432'),
  user: process.env.RDS_USERNAME || process.env.RDS_USER || 'postgres',
  password: RDS_PASSWORD,
  database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});
try {
  await client.connect();
  console.log('✅ Connection successful!');
  const result = await client.query('SELECT NOW()');
  console.log('✅ Query successful:', result.rows[0]);
  await client.end();
} catch (error: any) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
