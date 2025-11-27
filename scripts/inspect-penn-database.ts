import { createClient } from '@supabase/supabase-js';

const projectUrl = 'https://owbuzpxttovfssoarzwc.supabase.co';
const secretKey = 'REDACTED_SUPABASE_SECRET';

const supabase = createClient(projectUrl, secretKey);

async function inspectPennDatabase() {
  console.log('🔍 Inspecting Penn Supabase Database...\n');
  console.log('Project: https://owbuzpxttovfssoarzwc.supabase.co\n');
  console.log('═'.repeat(70));

  // Tables from the schema diagram
  const tables = [
    'products',
    'product_embeddings',
    'brands',
    'users',
    'user_events'
  ];

  const accessibleTables: string[] = [];

  for (const tableName of tables) {
    console.log(`\n📋 Table: ${tableName}`);
    console.log('─'.repeat(70));

    try {
      // Get row count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`❌ Cannot access: ${countError.message}`);
        continue;
      }

      accessibleTables.push(tableName);
      console.log(`✅ Accessible! Row count: ${count || 0}`);

      // Get sample data if table has rows
      if (count && count > 0) {
        const { data: sampleData, error: dataError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (dataError) {
          console.log(`⚠️  Could not fetch sample data: ${dataError.message}`);
        } else if (sampleData && sampleData.length > 0) {
          console.log('\n📊 Columns:');
          const columns = Object.keys(sampleData[0]);
          columns.forEach(col => {
            const value = sampleData[0][col];
            const type = typeof value;
            console.log(`  • ${col}: ${type}`);
          });

          console.log('\n📄 Sample row:');
          console.log(JSON.stringify(sampleData[0], null, 2));
        }
      } else {
        console.log('📊 Table is empty (no sample data available)');
      }

    } catch (err: any) {
      console.log(`❌ Unexpected error: ${err.message}`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('\n📊 Summary:');
  console.log(`Total tables checked: ${tables.length}`);
  console.log(`Accessible tables: ${accessibleTables.length}`);
  console.log(`\nAccessible: ${accessibleTables.join(', ') || 'none'}`);
  console.log('\n✅ Database inspection complete!');
}

inspectPennDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
