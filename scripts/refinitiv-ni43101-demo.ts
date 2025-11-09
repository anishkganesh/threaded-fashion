/**
 * Refinitiv NI 43-101 Document Retrieval Demo
 *
 * This script demonstrates how to retrieve NI 43-101 technical reports
 * from the Refinitiv LSEG database using the Filings API.
 */

interface RefinitivConfig {
  clientId: string;
  apiKey: string;
  bearerToken: string;
  baseUrl: string;
}

interface SignedUrlResponse {
  signedUrl: string;
}

interface SearchResponse {
  mimeType: string;
  signedUrl: string;
}

interface GraphQLFilingResult {
  filingId?: string;
  dcn?: string;
  docId?: string;
  filename?: string;
  filingDate?: string;
  companyName?: string;
  filingType?: string;
}

// Configuration
const config: RefinitivConfig = {
  clientId: 'REDACTED',
  apiKey: process.env.REFINITIV_API_KEY || 'REDACTED',
  bearerToken: process.env.REFINITIV_BEARER_TOKEN || '',
  baseUrl: 'https://api.refinitiv.com'
};

/**
 * Generic API request helper
 */
async function refinitivRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<T> {
  const url = `${config.baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'ClientID': config.clientId,
    'X-Api-Key': config.apiKey,
    'Accept': '*/*'
  };

  if (config.bearerToken) {
    headers['Authorization'] = `Bearer ${config.bearerToken}`;
  }

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  console.log(`\n🔹 ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Method 1: Retrieve document by DCN (Document Control Number)
 */
async function getDocumentByDCN(dcn: string): Promise<string> {
  console.log('\n📄 Method 1: Retrieving document by DCN...');
  const result = await refinitivRequest<SignedUrlResponse>(
    `/data/filings/v1/retrieval/search/dcn/${dcn}`
  );
  console.log('✅ Signed URL obtained:', result.signedUrl.substring(0, 100) + '...');
  return result.signedUrl;
}

/**
 * Method 2: Retrieve document by FilingId
 */
async function getDocumentByFilingId(filingId: string): Promise<string> {
  console.log('\n📄 Method 2: Retrieving document by FilingId...');
  const result = await refinitivRequest<SignedUrlResponse>(
    `/data/filings/v1/retrieval/search/filingId/${filingId}`
  );
  console.log('✅ Signed URL obtained:', result.signedUrl.substring(0, 100) + '...');
  return result.signedUrl;
}

/**
 * Method 3: Direct retrieval by filename (fastest method)
 */
async function getDocumentByFilename(filename: string): Promise<SearchResponse[]> {
  console.log('\n📄 Method 3: Direct retrieval by filename...');
  const result = await refinitivRequest<SearchResponse[]>(
    `/data/filings/v1/retrieval/${filename}`
  );
  console.log('✅ Document retrieved:', result.length, 'version(s) found');
  return result;
}

/**
 * Method 4: Search for NI 43-101 documents using GraphQL
 */
async function searchNI43101Documents(
  companyName?: string,
  startDate?: string,
  endDate?: string
): Promise<GraphQLFilingResult[]> {
  console.log('\n🔍 Method 4: Searching for NI 43-101 documents via GraphQL...');

  // Build GraphQL query
  const query = `
    query SearchNI43101 {
      FinancialFiling(
        filter: {
          filingType: "NI 43-101"
          ${companyName ? `companyName: "${companyName}"` : ''}
          ${startDate ? `filingDateFrom: "${startDate}"` : ''}
          ${endDate ? `filingDateTo: "${endDate}"` : ''}
        }
      ) {
        filingId
        dcn
        docId
        filename
        filingDate
        companyName
        filingType
      }
    }
  `;

  try {
    const result = await refinitivRequest<any>(
      '/data-store/v1/graphql',
      'POST',
      { query }
    );

    console.log('✅ GraphQL search completed');
    return result.data?.FinancialFiling || [];
  } catch (error) {
    console.log('⚠️  GraphQL query may need adjustment. Error:', (error as Error).message);
    console.log('💡 Tip: Use /data-store/v1/graphql/schema/sdl to see available fields');
    return [];
  }
}

/**
 * Download document from signed URL
 */
async function downloadDocument(signedUrl: string, outputPath: string): Promise<void> {
  console.log('\n⬇️  Downloading document...');
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, Buffer.from(buffer));

  console.log(`✅ Document saved to: ${outputPath}`);
  console.log(`   File size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * Get GraphQL schema to understand available fields
 */
async function getGraphQLSchema(): Promise<string> {
  console.log('\n📖 Fetching GraphQL schema...');
  const response = await fetch(`${config.baseUrl}/data-store/v1/graphql/schema/sdl`, {
    headers: {
      'X-Api-Key': config.apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Schema fetch failed: ${response.status}`);
  }

  const schema = await response.text();
  console.log('✅ Schema retrieved');
  return schema;
}

/**
 * Main demonstration function
 */
async function main() {
  console.log('🚀 Refinitiv NI 43-101 Document Retrieval Demo\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Retrieve by DCN (example DCN)
    console.log('\n\n📋 TEST 1: Retrieve document by DCN');
    console.log('-'.repeat(60));
    try {
      const url1 = await getDocumentByDCN('cr00329072');
      console.log('   Result: Success ✓');
    } catch (error) {
      console.log('   Result:', (error as Error).message);
    }

    // Test 2: Search for NI 43-101 documents (this will help us find real identifiers)
    console.log('\n\n📋 TEST 2: Search for NI 43-101 documents');
    console.log('-'.repeat(60));
    try {
      const filings = await searchNI43101Documents();
      if (filings.length > 0) {
        console.log(`\n   Found ${filings.length} NI 43-101 documents:`);
        filings.slice(0, 5).forEach((filing, idx) => {
          console.log(`\n   ${idx + 1}. ${filing.companyName || 'Unknown Company'}`);
          console.log(`      Filing Date: ${filing.filingDate || 'N/A'}`);
          console.log(`      Filing ID: ${filing.filingId || 'N/A'}`);
          console.log(`      DCN: ${filing.dcn || 'N/A'}`);
          console.log(`      Filename: ${filing.filename || 'N/A'}`);
        });
      }
    } catch (error) {
      console.log('   Result:', (error as Error).message);
    }

    // Test 3: Get GraphQL Schema
    console.log('\n\n📋 TEST 3: Understanding available data structure');
    console.log('-'.repeat(60));
    try {
      const schema = await getGraphQLSchema();
      // Save schema to file for reference
      const fs = await import('fs/promises');
      await fs.writeFile('./refinitiv-graphql-schema.sdl', schema);
      console.log('   ✅ Schema saved to: ./refinitiv-graphql-schema.sdl');
      console.log('   💡 Review this file to understand available query fields');
    } catch (error) {
      console.log('   Result:', (error as Error).message);
    }

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 SUMMARY & NEXT STEPS');
    console.log('='.repeat(60));
    console.log('\n✅ What works:');
    console.log('   • API authentication and connection');
    console.log('   • Document retrieval by identifier (DCN, FilingId, DocId)');
    console.log('   • Direct filename retrieval');

    console.log('\n❓ What we need to determine:');
    console.log('   • How to filter for NI 43-101 documents specifically');
    console.log('   • Correct GraphQL query structure (check schema file)');
    console.log('   • How SK-1300 documents are classified in the system');

    console.log('\n📝 To retrieve NI 43-101 docs, you need ONE of:');
    console.log('   1. Document Control Number (DCN)');
    console.log('   2. Filing ID (filingId)');
    console.log('   3. Document ID (docId)');
    console.log('   4. Exact filename');

    console.log('\n💡 Recommended next steps:');
    console.log('   1. Review the GraphQL schema file');
    console.log('   2. Contact Refinitiv support to get example NI 43-101 identifiers');
    console.log('   3. Ask about the correct field names for filtering by document type');
    console.log('   4. Once we have identifiers, use this script to download documents');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Example: How to use this script once you have identifiers
export async function downloadNI43101ByIdentifier(
  identifierType: 'dcn' | 'filingId' | 'docId' | 'filename',
  identifierValue: string,
  outputPath: string
): Promise<void> {
  console.log(`\n📥 Downloading NI 43-101 document...`);
  console.log(`   Type: ${identifierType}`);
  console.log(`   Value: ${identifierValue}`);

  let signedUrl: string;

  if (identifierType === 'filename') {
    const results = await getDocumentByFilename(identifierValue);
    signedUrl = results[0].signedUrl;
  } else {
    const result = await refinitivRequest<SignedUrlResponse>(
      `/data/filings/v1/retrieval/search/${identifierType}/${identifierValue}`
    );
    signedUrl = result.signedUrl;
  }

  await downloadDocument(signedUrl, outputPath);
}

// Run demo if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export functions for use in other scripts
export {
  getDocumentByDCN,
  getDocumentByFilingId,
  getDocumentByFilename,
  searchNI43101Documents,
  downloadDocument,
  getGraphQLSchema
};
