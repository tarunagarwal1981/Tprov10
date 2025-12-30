/**
 * Fix All Migration Files - Remove Supabase References
 * 
 * This script automatically fixes all migration files to:
 * 1. Replace auth.users with users
 * 2. Remove RLS policies (not used in AWS RDS)
 * 3. Remove auth.uid() references
 * 4. Remove ENABLE ROW LEVEL SECURITY statements
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase/migrations');

interface FixStats {
  filesProcessed: number;
  filesModified: number;
  replacements: number;
  rlsRemoved: number;
}

function fixMigrationFile(filePath: string): FixStats {
  const stats: FixStats = {
    filesProcessed: 1,
    filesModified: 0,
    replacements: 0,
    rlsRemoved: 0,
  };

  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let modified = false;

    // 1. Replace REFERENCES auth.users(id) with REFERENCES users(id)
    const authUsersRefRegex = /REFERENCES\s+auth\.users\(id\)/gi;
    const authUsersMatches = content.match(authUsersRefRegex);
    if (authUsersMatches) {
      content = content.replace(authUsersRefRegex, 'REFERENCES users(id)');
      stats.replacements += authUsersMatches.length;
      modified = true;
      console.log(`  ✓ Replaced ${authUsersMatches.length} auth.users references`);
    }

    // 2. Replace FROM auth.users with FROM users
    const fromAuthUsersRegex = /FROM\s+auth\.users/gi;
    const fromMatches = content.match(fromAuthUsersRegex);
    if (fromMatches) {
      content = content.replace(fromAuthUsersRegex, 'FROM users');
      stats.replacements += fromMatches.length;
      modified = true;
      console.log(`  ✓ Replaced ${fromMatches.length} FROM auth.users references`);
    }

    // 3. Remove RLS policies (entire CREATE POLICY blocks)
    // Match CREATE POLICY ... ON ... FOR ... USING/WITH CHECK ... ;
    const rlsPolicyRegex = /CREATE\s+POLICY\s+[^;]+;/gis;
    const rlsMatches = content.match(rlsPolicyRegex);
    if (rlsMatches) {
      content = content.replace(rlsPolicyRegex, '-- RLS Policy removed (not used in AWS RDS)');
      stats.rlsRemoved += rlsMatches.length;
      modified = true;
      console.log(`  ✓ Removed ${rlsMatches.length} RLS policies`);
    }

    // 4. Remove ALTER TABLE ... ENABLE ROW LEVEL SECURITY
    const enableRlsRegex = /ALTER\s+TABLE\s+[^\s]+\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;?/gi;
    const enableRlsMatches = content.match(enableRlsRegex);
    if (enableRlsMatches) {
      content = content.replace(enableRlsRegex, '-- RLS disabled (not used in AWS RDS)');
      stats.replacements += enableRlsMatches.length;
      modified = true;
      console.log(`  ✓ Removed ${enableRlsMatches.length} ENABLE RLS statements`);
    }

    // 5. Remove DROP POLICY statements (cleanup)
    const dropPolicyRegex = /DROP\s+POLICY\s+IF\s+EXISTS\s+[^;]+;?/gi;
    const dropMatches = content.match(dropPolicyRegex);
    if (dropMatches) {
      content = content.replace(dropPolicyRegex, '-- DROP POLICY removed (RLS not used)');
      stats.replacements += dropMatches.length;
      modified = true;
      console.log(`  ✓ Removed ${dropMatches.length} DROP POLICY statements`);
    }

    // 6. Remove auth.uid() references (replace with comments)
    const authUidRegex = /auth\.uid\(\)/gi;
    const authUidMatches = content.match(authUidRegex);
    if (authUidMatches) {
      // For USING/WITH CHECK clauses, comment them out
      content = content.replace(/USING\s*\([^)]*auth\.uid\(\)[^)]*\)/gi, 'USING (true) -- RLS removed');
      content = content.replace(/WITH\s+CHECK\s*\([^)]*auth\.uid\(\)[^)]*\)/gi, 'WITH CHECK (true) -- RLS removed');
      // For other contexts, just comment
      content = content.replace(authUidRegex, 'NULL -- auth.uid() removed (RLS not used)');
      stats.replacements += authUidMatches.length;
      modified = true;
      console.log(`  ✓ Removed ${authUidMatches.length} auth.uid() references`);
    }

    // 7. Remove references to auth.users in SELECT statements
    const selectAuthUsersRegex = /SELECT\s+[^F]*FROM\s+auth\.users/gi;
    const selectMatches = content.match(selectAuthUsersRegex);
    if (selectMatches) {
      content = content.replace(/FROM\s+auth\.users/gi, 'FROM users');
      stats.replacements += selectMatches.length;
      modified = true;
      console.log(`  ✓ Fixed SELECT FROM auth.users references`);
    }

    // 8. Remove JOIN auth.users
    const joinAuthUsersRegex = /JOIN\s+auth\.users/gi;
    const joinMatches = content.match(joinAuthUsersRegex);
    if (joinMatches) {
      content = content.replace(joinAuthUsersRegex, 'JOIN users');
      stats.replacements += joinMatches.length;
      modified = true;
      console.log(`  ✓ Fixed JOIN auth.users references`);
    }

    // 9. Remove comments mentioning Supabase Dashboard or auth.users
    content = content.replace(/--\s*Note:.*auth\.users.*/gi, '-- Note: Users table in public schema');
    content = content.replace(/--\s*Operators must be created in auth\.users.*/gi, '-- Note: Operators created in users table');

    if (modified && content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      stats.filesModified = 1;
      console.log(`  ✅ File fixed and saved`);
    } else if (!modified) {
      console.log(`  ⏭️  No changes needed`);
    }

  } catch (error) {
    console.error(`  ❌ Error processing file: ${error}`);
  }

  return stats;
}

function getAllMigrationFiles(): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(MIGRATIONS_DIR);
    
    for (const entry of entries) {
      const filePath = join(MIGRATIONS_DIR, entry);
      const stat = statSync(filePath);
      
      if (stat.isFile() && entry.endsWith('.sql')) {
        files.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading migrations directory: ${error}`);
  }
  
  return files.sort();
}

async function main() {
  console.log('🔧 Fixing All Migration Files - Removing Supabase References\n');
  console.log(`📁 Migrations directory: ${MIGRATIONS_DIR}\n`);

  const files = getAllMigrationFiles();
  console.log(`Found ${files.length} migration files\n`);

  const totalStats: FixStats = {
    filesProcessed: 0,
    filesModified: 0,
    replacements: 0,
    rlsRemoved: 0,
  };

  for (const filePath of files) {
    const fileName = filePath.split('/').pop() || filePath;
    console.log(`📄 Processing: ${fileName}`);
    
    const stats = fixMigrationFile(filePath);
    
    totalStats.filesProcessed += stats.filesProcessed;
    totalStats.filesModified += stats.filesModified;
    totalStats.replacements += stats.replacements;
    totalStats.rlsRemoved += stats.rlsRemoved;
    
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`  Files processed: ${totalStats.filesProcessed}`);
  console.log(`  Files modified: ${totalStats.filesModified}`);
  console.log(`  Total replacements: ${totalStats.replacements}`);
  console.log(`  RLS policies removed: ${totalStats.rlsRemoved}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (totalStats.filesModified > 0) {
    console.log('✅ Migration files fixed successfully!');
    console.log('⚠️  Please review the changes before running migrations.');
  } else {
    console.log('ℹ️  No files needed fixing (already clean).');
  }
}

main().catch(console.error);

