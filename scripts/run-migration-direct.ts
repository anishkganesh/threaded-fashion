#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dfxauievbyqwcynwtvib.supabase.co',
  'REDACTED_SUPABASE_JWT'
);

async function runMigration() {
  console.log('🔄 Running migration to add new financial metrics columns...\n');

  const migrationSQL = `
    ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS pre_tax_npv_usd_m numeric(10, 2),
    ADD COLUMN IF NOT EXISTS payback_years numeric(5, 2),
    ADD COLUMN IF NOT EXISTS annual_revenue_usd_m numeric(10, 2),
    ADD COLUMN IF NOT EXISTS annual_opex_usd_m numeric(10, 2),
    ADD COLUMN IF NOT EXISTS all_in_sustaining_cost numeric(10, 2),
    ADD COLUMN IF NOT EXISTS cash_cost numeric(10, 2),
    ADD COLUMN IF NOT EXISTS strip_ratio numeric(10, 2),
    ADD COLUMN IF NOT EXISTS recovery_rate_percent numeric(5, 2),
    ADD COLUMN IF NOT EXISTS reserves_tonnes numeric(20, 2),
    ADD COLUMN IF NOT EXISTS resources_tonnes numeric(20, 2),
    ADD COLUMN IF NOT EXISTS discount_rate_percent numeric(5, 2);
  `;

  try {
    // Test if columns already exist first
    const { data: test, error: testError } = await supabase
      .from('projects')
      .select('project_name')
      .limit(1);

    if (testError) {
      console.error('❌ Error checking table:', testError);
      return;
    }

    console.log('✅ Table exists, adding columns...');
    console.log('\nSQL to execute:');
    console.log(migrationSQL);

    console.log('\n⚠️  Note: Direct SQL execution via SDK is limited.');
    console.log('Please run the following command manually or via Supabase dashboard:\n');
    console.log('npx supabase db push');
    console.log('\nOr execute this SQL in the Supabase SQL Editor:');
    console.log(migrationSQL);

    // Check if any columns already exist
    const { data: sample } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (sample && sample[0]) {
      const existingColumns = Object.keys(sample[0]);
      const newColumns = [
        'pre_tax_npv_usd_m', 'payback_years', 'annual_revenue_usd_m',
        'annual_opex_usd_m', 'all_in_sustaining_cost', 'cash_cost',
        'strip_ratio', 'recovery_rate_percent', 'reserves_tonnes',
        'resources_tonnes', 'discount_rate_percent'
      ];

      const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col));

      if (columnsToAdd.length === 0) {
        console.log('\n✅ All columns already exist!');
      } else {
        console.log(`\n📊 Columns to add: ${columnsToAdd.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

runMigration().catch(console.error);