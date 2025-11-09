/**
 * Use GraphQL introspection to find how to query for document IDs
 * Then retrieve actual NI 43-101 document identifiers
 */

const REFINITIV_CONFIG = {
  apiKey: 'REDACTED',
  clientId: 'REDACTED',
  baseUrl: 'https://api.refinitiv.com',
  bearerToken: process.env.REFINITIV_BEARER_TOKEN || ''
};

async function graphqlQuery(query: string) {
  const url = `${REFINITIV_CONFIG.baseUrl}/data-store/v1/graphql`;

  const headers: Record<string, string> = {
    'ClientID': REFINITIV_CONFIG.clientId,
    'X-Api-Key': REFINITIV_CONFIG.apiKey,
    'Authorization': `Bearer ${REFINITIV_CONFIG.bearerToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

async function testQuery(name: string, query: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 ${name}`);
  console.log('='.repeat(70));

  try {
    const result = await graphqlQuery(query);

    if (result.errors) {
      console.log(`❌ Errors:`);
      result.errors.forEach((err: any) => {
        console.log(`   ${err.message}`);
      });
      return null;
    }

    if (result.data) {
      console.log(`✅ Success!`);
      console.log(JSON.stringify(result.data, null, 2));
      return result.data;
    }

  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔬 GraphQL Document ID Retrieval\n');

  if (!REFINITIV_CONFIG.bearerToken) {
    console.error('❌ REFINITIV_BEARER_TOKEN not set!\n');
    process.exit(1);
  }

  console.log(`✅ Token ready\n`);

  // Test 1: Introspection - what types can we query?
  await testQuery(
    'Introspection: Query types',
    `{
      __schema {
        queryType {
          fields {
            name
            description
          }
        }
      }
    }`
  );

  // Test 2: Get FinancialFiling args
  await testQuery(
    'Introspection: FinancialFiling args',
    `{
      __type(name: "RootQueryType") {
        fields {
          name
          args {
            name
            type {
              name
              kind
            }
          }
        }
      }
    }`
  );

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Complete');
  console.log('='.repeat(70));
}

if (require.main === module) {
  main().catch(console.error);
}
