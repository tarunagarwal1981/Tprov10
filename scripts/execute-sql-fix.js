/**
 * Execute the SQL fix directly
 */

const { query } = require('../src/lib/aws/lambda-database');
const fs = require('fs');
const path = require('path');

async function executeSqlFix() {
  try {
    console.log('Reading SQL file...\n');
    
    const sqlFile = path.join(__dirname, 'cleanup-and-fix-packages.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const result = await query(statement);
        console.log(`  ✓ Statement ${i + 1} executed successfully`);
        if (result.rowCount !== undefined) {
          console.log(`    Rows affected: ${result.rowCount}`);
        }
      } catch (error) {
        console.error(`  ✗ Statement ${i + 1} failed:`, error.message);
        // Continue with next statement
      }
    }
    
    console.log('\n✅ SQL execution complete!');
    
    // Verify the fix
    console.log('\nVerifying cities were added...');
    const verifyResult = await query(`
      SELECT p.title, COUNT(c.id) as city_count,
             array_agg(c.name ORDER BY c.city_order) as cities
      FROM multi_city_packages p
      LEFT JOIN multi_city_package_cities c ON c.package_id = p.id
      WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
        AND p.title IN (
          'Bali Beach & Culture: Kuta & Ubud',
          'Bali Extended Adventure: Kuta, Ubud & Legian',
          'Bali Cultural Journey: Ubud & Seminyak'
        )
        AND p.status = 'published'
      GROUP BY p.id, p.title
      ORDER BY p.title
    `);
    
    console.log('\nVerification results:');
    verifyResult.rows.forEach((row) => {
      const cities = row.cities?.filter(c => c) || [];
      console.log(`  ${row.title}: ${row.city_count} cities - ${cities.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  executeSqlFix()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { executeSqlFix };
