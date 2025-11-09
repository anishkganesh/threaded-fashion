import axios from 'axios';

const BEARER_TOKEN = "REDACTED_SUPABASE_JWT";

async function testQuery() {
  console.log('🔍 Testing Refinitiv GraphQL API for FinancialFiling...\n');

  // Test 1: Simple query to see what's available
  const testQuery1 = `
    query TestFilings {
      FinancialFiling(limit: 5) {
        _metadata {
          totalCount
        }
        FilingOrganization {
          Names {
            Name {
              OrganizationName {
                Name
              }
            }
          }
        }
        FilingDocument {
          DocumentSummary {
            DocumentTitle
            FeedName
            FormType
            FilingDate
            PageCount
          }
        }
      }
    }
  `;

  console.log('Test 1: Fetching any 5 filings...');
  try {
    const response1 = await axios.post(
      'https://api.refinitiv.com/data-store/v1/graphql',
      { query: testQuery1 },
      {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Query successful!');
    console.log('Total count:', response1.data.data.FinancialFiling?.[0]?._metadata?.totalCount);
    console.log('\nSample filings:');
    response1.data.data.FinancialFiling?.slice(0, 3).forEach((filing: any, i: number) => {
      console.log(`\n${i + 1}. ${filing.FilingDocument.DocumentSummary.DocumentTitle}`);
      console.log(`   Feed: ${filing.FilingDocument.DocumentSummary.FeedName}`);
      console.log(`   Form: ${filing.FilingDocument.DocumentSummary.FormType}`);
      console.log(`   Pages: ${filing.FilingDocument.DocumentSummary.PageCount}`);
    });
  } catch (error: any) {
    console.error('❌ Test 1 failed:', error.response?.data || error.message);
  }

  // Test 2: Filter by SEDAR
  console.log('\n\n' + '='.repeat(70));
  console.log('Test 2: Filtering for SEDAR filings...');
  const testQuery2 = `
    query SEDARFilings {
      FinancialFiling(
        filter: {
          FilingDocument: {
            DocumentSummary: {
              FeedName: {EQ: "SEDAR"}
            }
          }
        },
        limit: 10
      ) {
        _metadata {
          totalCount
        }
        FilingDocument {
          DocumentSummary {
            DocumentTitle
            FormType
            PageCount
            FilingDate
          }
        }
      }
    }
  `;

  try {
    const response2 = await axios.post(
      'https://api.refinitiv.com/data-store/v1/graphql',
      { query: testQuery2 },
      {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Query successful!');
    console.log('SEDAR filings found:', response2.data.data.FinancialFiling?.length || 0);
    response2.data.data.FinancialFiling?.forEach((filing: any, i: number) => {
      console.log(`\n${i + 1}. ${filing.FilingDocument.DocumentSummary.DocumentTitle}`);
      console.log(`   Form: ${filing.FilingDocument.DocumentSummary.FormType}`);
      console.log(`   Pages: ${filing.FilingDocument.DocumentSummary.PageCount}`);
    });
  } catch (error: any) {
    console.error('❌ Test 2 failed:', error.response?.data || error.message);
  }

  // Test 3: Search for documents with many pages
  console.log('\n\n' + '='.repeat(70));
  console.log('Test 3: Finding documents with 100+ pages...');
  const testQuery3 = `
    query LargeDocuments {
      FinancialFiling(
        filter: {
          FilingDocument: {
            DocumentSummary: {
              PageCount: {GT: 100}
            }
          }
        },
        sort: {FilingDocument: {DocumentSummary: {PageCount: DESC}}},
        limit: 10
      ) {
        FilingDocument {
          DocumentSummary {
            DocumentTitle
            FeedName
            FormType
            PageCount
            FilingDate
          }
        }
      }
    }
  `;

  try {
    const response3 = await axios.post(
      'https://api.refinitiv.com/data-store/v1/graphql',
      { query: testQuery3 },
      {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Query successful!');
    console.log('Large documents found:', response3.data.data.FinancialFiling?.length || 0);
    response3.data.data.FinancialFiling?.forEach((filing: any, i: number) => {
      console.log(`\n${i + 1}. ${filing.FilingDocument.DocumentSummary.DocumentTitle.substring(0, 80)}...`);
      console.log(`   Feed: ${filing.FilingDocument.DocumentSummary.FeedName}`);
      console.log(`   Form: ${filing.FilingDocument.DocumentSummary.FormType}`);
      console.log(`   Pages: ${filing.FilingDocument.DocumentSummary.PageCount}`);
    });
  } catch (error: any) {
    console.error('❌ Test 3 failed:', error.response?.data || error.message);
  }
}

testQuery().catch(console.error);
