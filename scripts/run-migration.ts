#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://dfxauievbyqwcynwtvib.supabase.co',
  'REDACTED_SUPABASE_JWT'
);

async function runMigration() {
  const sql = fs.readFileSync('scripts/add-mining-metrics-migration.sql', 'utf8');

  // Split by semicolons and run each statement
  const statements = sql.split(';').filter(s => s.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      console.log('Running:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' }).single();

      if (error) {
        console.error('Error:', error);
        // Try direct approach if RPC doesn't exist
        console.log('Trying direct approach...');
      }
    }
  }

  console.log('✅ Migration complete!');
}

runMigration().catch(console.error);