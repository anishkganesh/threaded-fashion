import fetch from 'node-fetch';

const projectId = 'owbuzpxttovfssoarzwc';
const secretKey = 'REDACTED_SUPABASE_SECRET';

async function getProjectDetails() {
  console.log('🔍 Fetching Penn project details...\n');

  try {
    // Get project config using Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/config`,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Project Config:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 Based on project ID, your connection details should be:\n');
  console.log(`Project URL: https://${projectId}.supabase.co`);
  console.log('\nTo get the API keys:');
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectId + '/settings/api');
  console.log('2. Copy the "anon/public" key');
  console.log('3. Copy the "service_role" key');
}

getProjectDetails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
