#!/usr/bin/env ts-node

/**
 * Delete existing queries from itinerary_queries table
 * This prevents conflicts with the new flow where query form appears after card clicks
 */

import { query } from '../src/lib/aws/lambda-database';

async function deleteQueries() {
  console.log('🗑️  Deleting existing queries from itinerary_queries table');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Count existing queries
    console.log('📊 Step 1: Counting existing queries...');
    const countResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM itinerary_queries'
    );

    const count = countResult.rows?.[0]?.count || 0;
    console.log(`Found ${count} queries`);
    console.log();

    if (count > 0) {
      // Step 2: Delete all queries
      console.log('🗑️  Step 2: Deleting all queries...');
      await query('DELETE FROM itinerary_queries');
      console.log('✅ Delete query executed successfully');
      console.log();

      // Step 3: Verify deletion
      console.log('✅ Step 3: Verifying deletion...');
      const verifyResult = await query<{ remaining_queries: number }>(
        'SELECT COUNT(*) as remaining_queries FROM itinerary_queries'
      );

      const remaining = verifyResult.rows?.[0]?.remaining_queries || 0;
      if (remaining === 0) {
        console.log(`✅ Success! All queries deleted. Remaining: ${remaining}`);
      } else {
        console.log(`⚠️  Warning: ${remaining} queries still remain`);
      }
    } else {
      console.log('ℹ️  No queries found. Nothing to delete.');
    }

    console.log();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteQueries();
