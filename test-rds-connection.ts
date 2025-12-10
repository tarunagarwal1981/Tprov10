import { Client } from 'pg';
const client = new Client({
  host: 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'ju3vrLHJUW8PqDG4',
  database: 'postgres',
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
