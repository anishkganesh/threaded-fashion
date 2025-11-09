/**
 * Refinitiv Authentication Test
 * Get bearer token and test document retrieval
 */

const REFINITIV_CONFIG = {
  username: 'anish@lithos-ai.com',
  password: 'REDACTED',
  apiKey: 'REDACTED',
  clientId: 'REDACTED'
};

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * Get OAuth2 bearer token
 */
async function getAuthToken(): Promise<TokenResponse> {
  console.log('🔐 Authenticating with Refinitiv...');

  const tokenUrl = 'https://api.refinitiv.com/auth/oauth2/v1/token';

  const params = new URLSearchParams({
    grant_type: 'password',
    username: REFINITIV_CONFIG.username,
    password: REFINITIV_CONFIG.password,
    client_id: REFINITIV_CONFIG.clientId
  });

  console.log('   Endpoint:', tokenUrl);
  console.log('   Username:', REFINITIV_CONFIG.username);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Auth failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Authentication successful!');
  console.log(`   Token type: ${data.token_type}`);
  console.log(`   Expires in: ${data.expires_in} seconds (${Math.floor(data.expires_in / 60)} minutes)`);
  console.log(`   Access token: ${data.access_token.substring(0, 50)}...`);

  return data;
}

/**
 * Test document retrieval with bearer token
 */
async function testDocumentRetrieval(bearerToken: string) {
  console.log('\n📄 Testing document retrieval...\n');

  const testCases = [
    { type: 'dcn', value: 'cr00329072', description: 'Sample DCN' },
    { type: 'docId', value: '49612437', description: 'Sample DocId' },
    { type: 'filingId', value: '34359955599', description: 'Sample FilingId' }
  ];

  for (const test of testCases) {
    console.log(`-`.repeat(60));
    console.log(`Test: ${test.description}`);
    console.log(`Type: ${test.type}, Value: ${test.value}`);

    try {
      const url = `https://api.refinitiv.com/data/filings/v1/retrieval/search/${test.type}/${test.value}`;

      const response = await fetch(url, {
        headers: {
          'ClientID': REFINITIV_CONFIG.clientId,
          'X-Api-Key': REFINITIV_CONFIG.apiKey,
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Failed: ${response.status} - ${errorText.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Success!`);
      console.log(`   Signed URL: ${data.signedUrl.substring(0, 100)}...`);

      // Try to get document metadata
      const metaResponse = await fetch(data.signedUrl, { method: 'HEAD' });
      if (metaResponse.ok) {
        const size = metaResponse.headers.get('content-length');
        const type = metaResponse.headers.get('content-type');
        console.log(`   File size: ${size ? (parseInt(size) / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}`);
        console.log(`   Content type: ${type || 'Unknown'}`);
      }

    } catch (error) {
      console.log(`❌ Error: ${(error as Error).message}`);
    }
  }
}

/**
 * Test GraphQL search
 */
async function testGraphQLSearch(bearerToken: string) {
  console.log('\n\n🔍 Testing GraphQL search for NI 43-101 documents...\n');
  console.log(`-`.repeat(60));

  const queries = [
    {
      name: 'Simple filing type search',
      query: `query { FinancialFiling(filter: { filingType: "NI 43-101" }, limit: 5) { filingId dcn filename companyName filingDate } }`
    },
    {
      name: 'Technical report search',
      query: `query { FinancialFiling(filter: { documentType: "Technical Report" }, limit: 5) { filingId dcn filename } }`
    },
    {
      name: 'SEDAR filing search',
      query: `query { SEDARFiling(filter: { formType: "NI 43-101" }, limit: 5) { filingId dcn issuerName filingDate } }`
    }
  ];

  for (const queryTest of queries) {
    console.log(`\nQuery: ${queryTest.name}`);

    try {
      const response = await fetch('https://api.refinitiv.com/data-store/v1/graphql', {
        method: 'POST',
        headers: {
          'X-Api-Key': REFINITIV_CONFIG.apiKey,
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: queryTest.query })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Failed: ${response.status}`);
        console.log(`   Error: ${errorText.substring(0, 300)}`);
        continue;
      }

      const data = await response.json();

      if (data.errors) {
        console.log(`❌ GraphQL Errors:`);
        data.errors.forEach((err: any) => console.log(`   - ${err.message}`));
        continue;
      }

      if (data.data) {
        console.log(`✅ Success!`);
        console.log(`   Results:`, JSON.stringify(data.data, null, 2).substring(0, 500));
      } else {
        console.log(`⚠️  No data returned`);
      }

    } catch (error) {
      console.log(`❌ Error: ${(error as Error).message}`);
    }
  }
}

/**
 * Get GraphQL schema
 */
async function getGraphQLSchema(): Promise<string | null> {
  console.log('\n\n📖 Fetching GraphQL schema...\n');
  console.log(`-`.repeat(60));

  try {
    const response = await fetch('https://api.refinitiv.com/data-store/v1/graphql/schema/sdl', {
      headers: {
        'X-Api-Key': REFINITIV_CONFIG.apiKey
      }
    });

    if (!response.ok) {
      console.log(`❌ Failed to fetch schema: ${response.status}`);
      return null;
    }

    const schema = await response.text();
    console.log(`✅ Schema retrieved (${(schema.length / 1024).toFixed(2)} KB)`);

    // Save to file
    const fs = await import('fs/promises');
    await fs.writeFile('./refinitiv-graphql-schema.sdl', schema);
    console.log(`   Saved to: ./refinitiv-graphql-schema.sdl`);

    // Search for relevant types
    const relevantLines = schema.split('\n').filter(line =>
      line.toLowerCase().includes('filing') ||
      line.toLowerCase().includes('sedar') ||
      line.toLowerCase().includes('document')
    );

    console.log(`\n   Found ${relevantLines.length} relevant schema lines:`);
    console.log(relevantLines.slice(0, 20).map(l => `   ${l}`).join('\n'));

    return schema;

  } catch (error) {
    console.log(`❌ Error: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Refinitiv API Authentication & Testing\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get bearer token
    const tokenData = await getAuthToken();

    // Save token for future use
    console.log('\n💾 Saving token to environment...');
    console.log(`   export REFINITIV_BEARER_TOKEN="${tokenData.access_token}"`);

    // Step 2: Test document retrieval
    await testDocumentRetrieval(tokenData.access_token);

    // Step 3: Test GraphQL
    await testGraphQLSearch(tokenData.access_token);

    // Step 4: Get schema
    await getGraphQLSchema();

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('\n✅ Authentication: Working');
    console.log(`   Token expires in: ${tokenData.expires_in} seconds`);
    console.log('\n📝 Next steps:');
    console.log('   1. Review GraphQL schema file for correct field names');
    console.log('   2. Use working bearer token for document retrieval');
    console.log('   3. Identify NI 43-101 document identifiers');
    console.log('   4. Begin bulk download process');

    console.log('\n🔑 To use this token in other scripts:');
    console.log(`   export REFINITIV_BEARER_TOKEN="${tokenData.access_token}"`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

export { getAuthToken, testDocumentRetrieval, testGraphQLSearch };
